'use client';
import { getToken } from 'firebase/messaging';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { messaging, db } from './firebase';
import { User, Message } from '@/types';

export async function requestNotificationPermission(userId: string) {
  if (!messaging || typeof window === 'undefined' || !('Notification' in window) || !navigator.serviceWorker) {
    console.log('This browser does not support desktop notification');
    return;
  }
  
  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Service Worker registered with scope:', registration.scope);
  } catch (error) {
    console.error('Service Worker registration failed:', error);
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
      serviceWorkerRegistration: await navigator.serviceWorker.ready,
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

export async function sendNotification(recipient: User, message: Partial<Message>, sender: User) {
    if (!recipient.fcmToken) {
        console.log("Recipient does not have a FCM token.");
        return;
    }

    try {
        await addDoc(collection(db, 'notifications'), {
            recipientId: recipient.uid,
            recipientToken: recipient.fcmToken,
            senderId: sender.uid,
            senderName: sender.displayName,
            senderPhoto: sender.photoURL,
            messageText: message.text || `Sent a ${message.fileType?.split('/')[0] || 'file'}.`,
            chatId: [sender.uid, recipient.uid].sort().join('_'),
            createdAt: serverTimestamp(),
        });
    } catch(error) {
        console.error('Error sending notification:', error);
    }
}
