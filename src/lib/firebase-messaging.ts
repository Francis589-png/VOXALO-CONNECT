
'use client';

import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { app, db } from './firebase';

export const requestNotificationPermission = async (userId: string) => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.log('This browser does not support desktop notification');
    return;
  }
  
  const messaging = getMessaging(app);

  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    console.log('Notification permission granted.');
    try {
      const currentToken = await getToken(messaging, {
        vapidKey: 'BPE1_m9i8tu_D6vj8vso-p3c8E23c8E23c8E23c8E23c8E23c8E23c8E23c8E23c8E23c8E23c8E23',
      });
      if (currentToken) {
        await updateDoc(doc(db, 'users', userId), {
          fcmToken: currentToken,
        });
      } else {
        console.log('No registration token available. Request permission to generate one.');
      }
    } catch (err) {
      console.log('An error occurred while retrieving token. ', err);
    }
  } else {
    console.log('Unable to get permission to notify.');
  }
};

export const onMessageListener = () => {
    const messaging = getMessaging(app);
    return new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
  });
}
