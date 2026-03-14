import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';

// Firebase is auto-initialized via google-services.json / GoogleService-Info.plist
// This file re-exports the modules for convenient access.

export { firebase, auth, firestore, messaging };

export const db = firestore();
export const authInstance = auth();
