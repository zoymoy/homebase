import * as Notifications from 'expo-notifications';
import messaging from '@react-native-firebase/messaging';
import { db } from '@/config/firebase';
import firestore from '@react-native-firebase/firestore';
import { Platform } from 'react-native';
import { router } from 'expo-router';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const notificationsService = {
  async requestPermission(): Promise<boolean> {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    return enabled;
  },

  async registerToken(userId: string): Promise<void> {
    try {
      const token = await messaging().getToken();
      await db.collection('users').doc(userId).update({
        fcmTokens: firestore.FieldValue.arrayUnion(token),
      });
    } catch (error) {
      console.warn('Failed to register FCM token:', error);
    }
  },

  setupTokenRefresh(userId: string) {
    return messaging().onTokenRefresh(async (token) => {
      await db.collection('users').doc(userId).update({
        fcmTokens: firestore.FieldValue.arrayUnion(token),
      });
    });
  },

  setupNotificationListeners() {
    // Handle notification tap when app is in background/quit
    messaging().onNotificationOpenedApp((remoteMessage) => {
      const data = remoteMessage.data;
      if (data?.choreId) {
        router.push(`/chore/${data.choreId}`);
      }
    });

    // Handle notification tap when app was quit
    messaging().getInitialNotification().then((remoteMessage) => {
      if (remoteMessage?.data?.choreId) {
        router.push(`/chore/${remoteMessage.data.choreId}`);
      }
    });

    // Handle foreground messages
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      // Show local notification for foreground messages
      if (remoteMessage.notification) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: remoteMessage.notification.title ?? '',
            body: remoteMessage.notification.body ?? '',
            data: remoteMessage.data as Record<string, string>,
          },
          trigger: null,
        });
      }
    });

    // Handle local notification taps
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (data?.choreId) {
          router.push(`/chore/${data.choreId}`);
        }
      }
    );

    return () => {
      unsubscribe();
      subscription.remove();
    };
  },
};
