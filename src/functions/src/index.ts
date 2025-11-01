
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
        
        // This is the main change: Send ONLY a data payload.
        // This ensures the message is always passed to the app's onMessage handler.
        const payload = {
          data: {
            title: `New message from ${senderData.displayName}`,
            body: messageText,
            icon: senderData.photoURL || '',
            chatId: chatId,
          }
        };

        try {
          await admin.messaging().sendToDevice(userData.fcmToken, payload);
          tokens.push(userData.fcmToken);
        } catch (error) {
            console.error(`Failed to send notification to user ${userId}`, error);
            // If a token is invalid, we could remove it from the user's document here.
            if ((error as any).code === 'messaging/registration-token-not-registered') {
              await admin.firestore().collection('users').doc(userId).update({ fcmToken: null });
            }
        }
      }
    }
  });
