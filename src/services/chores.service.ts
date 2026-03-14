import { db } from '@/config/firebase';
import { Chore, ChoreStatus, Recurrence } from '@/types';
import firestore from '@react-native-firebase/firestore';

function choresRef(familyId: string) {
  return db.collection('families').doc(familyId).collection('chores');
}

export const choresService = {
  subscribeToChores(
    familyId: string,
    callback: (chores: Chore[]) => void
  ) {
    return choresRef(familyId)
      .orderBy('createdAt', 'desc')
      .onSnapshot((snapshot) => {
        const chores = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Chore[];
        callback(chores);
      });
  },

  async createChore(
    familyId: string,
    data: {
      title: string;
      assigneeId?: string | null;
      assigneeName?: string | null;
      deadline?: Date | null;
      recurrence?: Recurrence | null;
      createdBy: string;
    }
  ): Promise<string> {
    const now = firestore.Timestamp.now();
    const choreData = {
      title: data.title,
      assigneeId: data.assigneeId ?? null,
      assigneeName: data.assigneeName ?? null,
      status: 'todo' as ChoreStatus,
      deadline: data.deadline ? firestore.Timestamp.fromDate(data.deadline) : null,
      createdBy: data.createdBy,
      completedBy: null,
      completedAt: null,
      recurrence: data.recurrence ?? null,
      reminder24hSent: false,
      reminder1hSent: false,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await choresRef(familyId).add(choreData);
    return docRef.id;
  },

  async claimChore(familyId: string, choreId: string, userId: string, userName: string): Promise<void> {
    await choresRef(familyId).doc(choreId).update({
      assigneeId: userId,
      assigneeName: userName,
      updatedAt: firestore.Timestamp.now(),
    });
  },

  async completeChore(familyId: string, choreId: string, userId: string): Promise<void> {
    await choresRef(familyId).doc(choreId).update({
      status: 'done',
      completedBy: userId,
      completedAt: firestore.Timestamp.now(),
      updatedAt: firestore.Timestamp.now(),
    });
  },

  async uncompleteChore(familyId: string, choreId: string): Promise<void> {
    await choresRef(familyId).doc(choreId).update({
      status: 'todo',
      completedBy: null,
      completedAt: null,
      updatedAt: firestore.Timestamp.now(),
    });
  },

  async deleteChore(familyId: string, choreId: string): Promise<void> {
    await choresRef(familyId).doc(choreId).delete();
  },
};
