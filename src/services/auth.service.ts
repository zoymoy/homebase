import { authInstance, db } from '@/config/firebase';
import { User } from '@/types';
import firestore from '@react-native-firebase/firestore';
import { Colors } from '@/constants/colors';

export const authService = {
  async signUp(email: string, password: string, displayName: string): Promise<User> {
    const credential = await authInstance.createUserWithEmailAndPassword(email, password);
    const uid = credential.user.uid;
    const avatarColor = Colors.avatarColors[Math.floor(Math.random() * Colors.avatarColors.length)];
    const now = firestore.Timestamp.now();

    const userData: Omit<User, 'uid'> & { uid: string } = {
      uid,
      displayName,
      email,
      avatarColor,
      familyId: null,
      fcmTokens: [],
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('users').doc(uid).set(userData);
    return userData;
  },

  async signIn(email: string, password: string): Promise<void> {
    await authInstance.signInWithEmailAndPassword(email, password);
  },

  async signOut(): Promise<void> {
    await authInstance.signOut();
  },

  async getUser(uid: string): Promise<User | null> {
    const doc = await db.collection('users').doc(uid).get();
    if (!doc.exists()) return null;
    return { uid: doc.id, ...doc.data() } as User;
  },

  async updateUser(uid: string, data: Partial<User>): Promise<void> {
    await db.collection('users').doc(uid).update({
      ...data,
      updatedAt: firestore.Timestamp.now(),
    });
  },
};
