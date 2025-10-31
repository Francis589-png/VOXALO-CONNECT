'use client';

import { getMessaging, getToken, onMessage, type MessagePayload } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { app, db } from './firebase';

export const requestNotificationPermission = async (userId: string) => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.log('This browser does not support desktop notification');
    return;
  }
  
  const messaging = getMessaging(app);

  try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        // IMPORTANT: Replace with your actual VAPID key from the Firebase console.
        // This key is safe to be public.
        const currentToken = await getToken(messaging, {
            vapidKey: 'YOUR_VAPID_KEY_FROM_FIREBASE',
        });
        if (currentToken) {
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


export const onMessageListener = (callback: (payload: MessagePayload) => void) => {
    const messaging = getMessaging(app);
    return onMessage(messaging, (payload) => {
        callback(payload);
    });
}
