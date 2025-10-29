'use client';
import { getToken } from 'firebase/messaging';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { messaging, db } from './firebase';
import { User, Message } from '@/types';

const VAPID_KEY = 'YOUR_VAPID_KEY_HERE'; // This needs to be generated in Firebase Console

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

// This is a client-side implementation for demo purposes.
// In a production app, this logic should be on a server using Firebase Functions.
export async function sendNotification(recipient: User, message: Partial<Message>, sender: User) {
    if (!recipient.fcmToken) {
        console.log("Recipient does not have a FCM token.");
        return;
    }

    const notificationPayload = {
        to: recipient.fcmToken,
        notification: {
            title: `New message from ${sender.displayName}`,
            body: message.text || `Sent a ${message.fileType?.split('/')[0] || 'file'}.`,
            icon: sender.photoURL || '/favicon.ico',
            sound: '/notification.mp3',
        },
        data: {
          senderId: sender.uid,
          chatId: [sender.uid, recipient.uid].sort().join('_')
        }
    };

    // Note: This is NOT a secure way to send notifications as it exposes the server key.
    // This is for demonstration purposes only. Use Firebase Functions in production.
    const FCM_SERVER_KEY = "YOUR_FCM_SERVER_KEY_HERE";

    try {
        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `key=${FCM_SERVER_KEY}`
            },
            body: JSON.stringify(notificationPayload)
        });

        if (response.ok) {
            console.log('Notification sent successfully');
        } else {
            const errorData = await response.json();
            console.error('Failed to send notification:', errorData);
        }
    } catch (error) {
        console.error('Error sending notification:', error);
    }
}