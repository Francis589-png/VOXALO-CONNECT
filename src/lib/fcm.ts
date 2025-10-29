'use client';
import { getToken } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { messaging, db } from './firebase';

const VAPID_KEY = 'YOUR_VAPID_KEY_HERE'; // This needs to be generated in Firebase Console

export async function requestNotificationPermission(userId: string) {
  if (!messaging || typeof window === 'undefined' || !('Notification' in window)) {
    console.log('This browser does not support desktop notification');
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    console.log('Notification permission granted.');
    await getAndSaveToken(userId);
  } else {
    console.log('Unable to get permission to notify.');
  }
}

async function getAndSaveToken(userId: string) {
    if (!messaging) return;
  try {
    const currentToken = await getToken(messaging, {
      vapidKey: 'BJEZik5L91-17Nl2x5y2h3R4A9H7x6I1W0h9W0g8t5k3M8y4v3u2n1o0i9l8k7j6h5g4f3d2c1b0a',
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
  } catch (error) {
    console.error('An error occurred while retrieving token. ', error);
  }
}
