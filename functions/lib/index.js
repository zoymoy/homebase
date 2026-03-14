"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinFamily = exports.onEtaEventCreated = exports.sendDeadlineReminders = exports.onChoreCompleted = void 0;
const admin = require("firebase-admin");
const firestore_1 = require("firebase-functions/v2/firestore");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const https_1 = require("firebase-functions/v2/https");
admin.initializeApp();
const db = admin.firestore();
// Helper: send push to family members
async function sendPushToFamily(familyId, excludeUid, notification, data) {
    const familyDoc = await db.collection('families').doc(familyId).get();
    if (!familyDoc.exists)
        return;
    const memberIds = familyDoc.data()?.memberIds ?? [];
    const targetIds = memberIds.filter((id) => id !== excludeUid);
    if (targetIds.length === 0)
        return;
    const usersSnapshot = await db
        .collection('users')
        .where('uid', 'in', targetIds)
        .get();
    const tokens = [];
    usersSnapshot.docs.forEach((doc) => {
        const fcmTokens = doc.data().fcmTokens ?? [];
        tokens.push(...fcmTokens);
    });
    if (tokens.length === 0)
        return;
    const message = {
        tokens,
        notification,
        data: data ?? {},
    };
    const response = await admin.messaging().sendEachForMulticast(message);
    // Clean up stale tokens
    const failedTokens = [];
    response.responses.forEach((resp, idx) => {
        if (!resp.success &&
            (resp.error?.code === 'messaging/invalid-registration-token' ||
                resp.error?.code === 'messaging/registration-token-not-registered')) {
            failedTokens.push(tokens[idx]);
        }
    });
    if (failedTokens.length > 0) {
        // Remove stale tokens
        for (const doc of usersSnapshot.docs) {
            const userTokens = doc.data().fcmTokens ?? [];
            const stale = userTokens.filter((t) => failedTokens.includes(t));
            if (stale.length > 0) {
                await doc.ref.update({
                    fcmTokens: admin.firestore.FieldValue.arrayRemove(...stale),
                });
            }
        }
    }
}
// --- onChoreCompleted ---
exports.onChoreCompleted = (0, firestore_1.onDocumentUpdated)('families/{familyId}/chores/{choreId}', async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after)
        return;
    // Only trigger when status changes from 'todo' to 'done'
    if (before.status === 'todo' && after.status === 'done') {
        const familyId = event.params.familyId;
        const completedBy = after.completedBy;
        // Get completer's name
        const userDoc = await db.collection('users').doc(completedBy).get();
        const userName = userDoc.data()?.displayName ?? 'Someone';
        await sendPushToFamily(familyId, completedBy, {
            title: 'Chore Completed!',
            body: `${userName} finished "${after.title}"`,
        }, { choreId: event.params.choreId });
        // Handle recurrence: create next chore
        if (after.recurrence && after.deadline) {
            const recurrence = after.recurrence;
            const currentDeadline = after.deadline.toDate();
            let nextDeadline;
            switch (recurrence.type) {
                case 'daily':
                    nextDeadline = new Date(currentDeadline.getTime() + 86400000);
                    break;
                case 'weekly':
                    nextDeadline = new Date(currentDeadline.getTime() + 604800000);
                    break;
                case 'custom':
                    nextDeadline = new Date(currentDeadline.getTime() + (recurrence.intervalDays ?? 1) * 86400000);
                    break;
                default:
                    nextDeadline = new Date(currentDeadline.getTime() + 86400000);
            }
            await db
                .collection('families')
                .doc(familyId)
                .collection('chores')
                .add({
                title: after.title,
                assigneeId: null,
                assigneeName: null,
                status: 'todo',
                deadline: admin.firestore.Timestamp.fromDate(nextDeadline),
                createdBy: completedBy,
                completedBy: null,
                completedAt: null,
                recurrence: after.recurrence,
                reminder24hSent: false,
                reminder1hSent: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
    }
});
// --- sendDeadlineReminders (every 15 min) ---
exports.sendDeadlineReminders = (0, scheduler_1.onSchedule)('every 15 minutes', async () => {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 3600000);
    const twentyFourHoursFromNow = new Date(now.getTime() + 86400000);
    // Get all families
    const familiesSnapshot = await db.collection('families').get();
    for (const familyDoc of familiesSnapshot.docs) {
        const choresSnapshot = await familyDoc.ref
            .collection('chores')
            .where('status', '==', 'todo')
            .get();
        for (const choreDoc of choresSnapshot.docs) {
            const chore = choreDoc.data();
            if (!chore.deadline)
                continue;
            const deadline = chore.deadline.toDate();
            // 24h reminder
            if (!chore.reminder24hSent &&
                deadline <= twentyFourHoursFromNow &&
                deadline > oneHourFromNow) {
                const assigneeName = chore.assigneeName ?? 'Unassigned';
                await sendPushToFamily(familyDoc.id, '', // send to everyone
                {
                    title: 'Chore Due Tomorrow',
                    body: `"${chore.title}" (${assigneeName}) is due in less than 24 hours`,
                }, { choreId: choreDoc.id });
                await choreDoc.ref.update({ reminder24hSent: true });
            }
            // 1h reminder
            if (!chore.reminder1hSent && deadline <= oneHourFromNow && deadline > now) {
                const assigneeName = chore.assigneeName ?? 'Unassigned';
                await sendPushToFamily(familyDoc.id, '', {
                    title: 'Chore Due Soon!',
                    body: `"${chore.title}" (${assigneeName}) is due in less than 1 hour!`,
                }, { choreId: choreDoc.id });
                await choreDoc.ref.update({ reminder1hSent: true });
            }
        }
    }
});
// --- onEtaEventCreated ---
exports.onEtaEventCreated = (0, firestore_1.onDocumentCreated)('families/{familyId}/eta_events/{eventId}', async (event) => {
    const data = event.data?.data();
    if (!data)
        return;
    const familyId = event.params.familyId;
    await sendPushToFamily(familyId, data.userId, {
        title: 'Someone is heading home!',
        body: `${data.userName} is on their way home — arriving in ~${data.etaMinutes} mins.`,
    });
});
// --- joinFamily (callable) ---
exports.joinFamily = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new https_1.HttpsError('unauthenticated', 'Must be signed in');
    }
    const { inviteCode } = request.data;
    if (!inviteCode || typeof inviteCode !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'Invite code is required');
    }
    const snapshot = await db
        .collection('families')
        .where('inviteCode', '==', inviteCode.toUpperCase())
        .limit(1)
        .get();
    if (snapshot.empty) {
        throw new https_1.HttpsError('not-found', 'Invalid invite code');
    }
    const familyDoc = snapshot.docs[0];
    const familyData = familyDoc.data();
    if (familyData.memberIds.includes(uid)) {
        throw new https_1.HttpsError('already-exists', 'Already a member');
    }
    const batch = db.batch();
    batch.update(familyDoc.ref, {
        memberIds: admin.firestore.FieldValue.arrayUnion(uid),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    batch.update(db.collection('users').doc(uid), {
        familyId: familyDoc.id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await batch.commit();
    return {
        familyId: familyDoc.id,
        familyName: familyData.name,
    };
});
//# sourceMappingURL=index.js.map