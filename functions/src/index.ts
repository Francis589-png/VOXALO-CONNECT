import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

exports.sendChatNotification = functions.firestore
  .document('chats/{chatId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const { chatId } = context.params;

    if (!message) {
      return;
    }

    const chatDoc = await admin.firestore().collection('chats').doc(chatId).get();
    const chatData = chatDoc.data();

    if (!chatData) {
      return;
    }

    const senderId = message.senderId;
    const recipientIds = chatData.users.filter((id: string) => id !== senderId);

    const senderDoc = await admin.firestore().collection('users').doc(senderId).get();
    const senderData = senderDoc.data();

    if (!senderData) {
      return;
    }
    
    let messageText = message.text;
    if (message.type === 'image') {
        messageText = 'Sent an image';
    } else if (message.type === 'file') {
        messageText = 'Sent a file';
    }

    const tokens: string[] = [];
    for (const userId of recipientIds) {
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      const userData = userDoc.data();
      if (userData && userData.fcmToken) {
        
        const payload: admin.messaging.MessagingPayload = {
          notification: {
            title: `New message from ${senderData.displayName}`,
            body: messageText,
            icon: senderData.photoURL || undefined,
            click_action: `https://voxalo-x.web.app/`
          },
          data: {
            sender: JSON.stringify(senderData),
            message: JSON.stringify(message),
            soundEnabled: String(userData.notificationSounds || false),
            chatId: chatId,
          }
        };

        try {
          await admin.messaging().sendToDevice(userData.fcmToken, payload);
          tokens.push(userData.fcmToken);
        } catch (error) {
            console.error(`Failed to send notification to user ${userId}`, error);
        }
      }
    }
  });
