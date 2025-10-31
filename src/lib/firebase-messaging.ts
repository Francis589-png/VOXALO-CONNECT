'use client';

import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app, db } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';

export async function requestNotificationPermission(userId: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.log('This browser does not support desktop notification');
    return;
  }
  
  const messaging = getMessaging(app);

  // Handle foreground messages
  onMessage(messaging, (payload) => {
    console.log('Message received. ', payload);
    const notificationTitle = payload.notification?.title || 'New Message';
    const notificationOptions = {
        body: payload.notification?.body || '',
        icon: payload.notification?.icon || '/favicon.ico'
    };
    new Notification(notificationTitle, notificationOptions);
  });
  
  const permission = await Notification.requestPermission();

  if (permission === 'granted') {
    console.log('Notification permission granted.');
    try {
      const currentToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY,
      });
      if (currentToken) {
        console.log('FCM Token:', currentToken);
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, {
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
}
