'use client';
import { getToken } from 'firebase/messaging';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { messaging, db } from './firebase';
import { User, Message } from '@/types';

export async function requestNotificationPermission(userId: string) {
  if (!messaging || typeof window === 'undefined' || !('Notification' in window) || !navigator.serviceWorker) {
    console.log('This browser does not support desktop notification');
    return;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
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
    const vapidKey = process.env.NEXT_PUBLIC_FCM_VAPID_KEY;
    if (!vapidKey) {
        console.error('FCM VAPID key not found in environment variables.');
        return;
    }
    const currentToken = await getToken(messaging, {
      vapidKey: vapidKey,
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

    const serverKey = process.env.NEXT_PUBLIC_FCM_SERVER_KEY;
    
    if (!serverKey) {
        console.warn('FCM Server Key is not set in .env.local. Notifications will not be sent. Please get it from your Firebase project settings.');
        return;
    }

    const notificationPayload = {
        to: recipient.fcmToken,
        notification: {
            title: `Message from ${sender.displayName || 'a friend'}`,
            body: message.text || `Sent a ${message.fileType?.split('/')[0] || 'file'}.`,
            icon: sender.photoURL || '/icon.png',
            click_action: `${window.location.origin}`,
            sound: '/notification.mp3'
        },
        data: {
            chatId: [sender.uid, recipient.uid].sort().join('_'),
            senderId: sender.uid,
        }
    };
    
    try {
        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `key=${serverKey}`
            },
            body: JSON.stringify(notificationPayload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error sending notification:', errorData);
        } else {
            console.log('Notification sent successfully');
        }
    } catch(error) {
        console.error('Error sending notification:', error);
    }
}
