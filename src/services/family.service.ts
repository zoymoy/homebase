import { db } from '@/config/firebase';
import { Family, HomeAddress, User } from '@/types';
import firestore from '@react-native-firebase/firestore';


function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const familyService = {
  async createFamily(name: string, homeAddress: HomeAddress, creatorUid: string): Promise<Family> {
    const now = firestore.Timestamp.now();
    const inviteCode = generateInviteCode();

    const familyData = {
      name,
      homeAddress,
      memberIds: [creatorUid],
      inviteCode,
      createdBy: creatorUid,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection('families').add(familyData);

    // Update user's familyId
    await db.collection('users').doc(creatorUid).update({
      familyId: docRef.id,
      updatedAt: now,
    });

    // Create default lists
    const batch = db.batch();
    batch.set(docRef.collection('lists').doc('grocery'), {
      id: 'grocery',
      items: [],
      updatedAt: now,
    });
    batch.set(docRef.collection('lists').doc('errands'), {
      id: 'errands',
      items: [],
      updatedAt: now,
    });
    await batch.commit();

    return { id: docRef.id, ...familyData };
  },

  async joinFamily(inviteCode: string, userId: string): Promise<Family> {
    // Query for family with matching invite code
    const snapshot = await db
      .collection('families')
      .where('inviteCode', '==', inviteCode.toUpperCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new Error('Invalid invite code');
    }

    const familyDoc = snapshot.docs[0];
    const familyData = familyDoc.data() as Omit<Family, 'id'>;

    if (familyData.memberIds.includes(userId)) {
      throw new Error('You are already a member of this family');
    }

    const now = firestore.Timestamp.now();

    // Add user to family
    await familyDoc.ref.update({
      memberIds: firestore.FieldValue.arrayUnion(userId),
      updatedAt: now,
    });

    // Update user's familyId
    await db.collection('users').doc(userId).update({
      familyId: familyDoc.id,
      updatedAt: now,
    });

    return {
      id: familyDoc.id,
      ...familyData,
      memberIds: [...familyData.memberIds, userId],
    };
  },

  async getFamily(familyId: string): Promise<Family | null> {
    const doc = await db.collection('families').doc(familyId).get();
    if (!doc.exists()) return null;
    return { id: doc.id, ...doc.data() } as Family;
  },

  subscribeToFamily(familyId: string, callback: (family: Family) => void) {
    return db.collection('families').doc(familyId).onSnapshot((doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as Family);
      }
    });
  },

  async getFamilyMembers(memberIds: string[]): Promise<User[]> {
    if (memberIds.length === 0) return [];
    // Firestore 'in' queries support max 30 items - fine for families
    const snapshot = await db
      .collection('users')
      .where('uid', 'in', memberIds)
      .get();
    return snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() } as User));
  },
};
