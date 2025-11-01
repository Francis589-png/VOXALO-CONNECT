'use client';

import { getMessaging, getToken, onMessage, type MessagePayload } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { app, db } from './firebase';

// Ensure messaging is initialized only in the browser
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

export const requestNotificationPermission = async (userId: string) => {
  if (!messaging) {
    console.log('Firebase Messaging is not supported in this environment.');
    return;
  }
  
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.log('This browser does not support desktop notification');
    return;
  }

  try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        // IMPORTANT: Replace with your actual VAPID key from the Firebase console.
        // Go to Project settings > Cloud Messaging > Web configuration and click "Generate key pair".
        const currentToken = await getToken(messaging, {
            vapidKey: 'YOUR_VAPID_KEY_FROM_FIREBASE_CONSOLE',
        });
        if (currentToken) {
            console.log('FCM Token:', currentToken);
            await updateDoc(doc(db, 'users', userId), {
              fcmToken: currentToken,
            });
        } else {
            console.log('No registration token available. Request permission to generate one.');
        }
      } else {
        console.log('Unable to get permission to notify.');
      }
  } catch (err) {
      console.log('An error occurred while retrieving token. ', err);
  }
};
