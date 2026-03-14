import { db } from '@/config/firebase';
import { EtaEvent, EtaStatus } from '@/types';
import firestore from '@react-native-firebase/firestore';

function etaRef(familyId: string) {
  return db.collection('families').doc(familyId).collection('eta_events');
}

export const etaService = {
  async createEtaEvent(
    familyId: string,
    data: {
      userId: string;
      userName: string;
      startLocation: { lat: number; lng: number };
      etaMinutes: number;
    }
  ): Promise<string> {
    const docRef = await etaRef(familyId).add({
      ...data,
      status: 'active' as EtaStatus,
      createdAt: firestore.Timestamp.now(),
    });
    return docRef.id;
  },

  subscribeToActiveEtas(
    familyId: string,
    callback: (events: EtaEvent[]) => void
  ) {
    return etaRef(familyId)
      .where('status', '==', 'active')
      .onSnapshot((snapshot) => {
        const events = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as EtaEvent[];
        callback(events);
      });
  },

  async cancelEta(familyId: string, eventId: string): Promise<void> {
    await etaRef(familyId).doc(eventId).update({
      status: 'cancelled',
    });
  },

  async markArrived(familyId: string, eventId: string): Promise<void> {
    await etaRef(familyId).doc(eventId).update({
      status: 'arrived',
    });
  },
};
