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

    for (const userId of recipientIds) {
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      const userData = userDoc.data();
      if (userData && userData.fcmToken) {
        // This is a data-only payload. This ensures the message is always
        // passed to the app's onMessage handler (foreground) or the
        // service worker's onBackgroundMessage handler (background).
        const payload = {
          data: {
            title: `New message from ${senderData.displayName}`,
            body: messageText,
            icon: senderData.photoURL || '/favicon.ico',
            chatId: chatId,
          }
        };

        try {
          await admin.messaging().sendToDevice(userData.fcmToken, payload);
        } catch (error) {
            console.error(`Failed to send notification to user ${userId}`, error);
            if ((error as any).code === 'messaging/registration-token-not-registered') {
              await admin.firestore().collection('users').doc(userId).update({ fcmToken: null });
            }
        }
      }
    }
  });

exports.sendJttNewsNotification = functions.firestore
  .document('jtt-news/{postId}')
  .onCreate(async (snap) => {
    const post = snap.data();
    if (!post) {
      return;
    }

    const payload = {
      notification: {
        title: `New JTT News from ${post.authorName}`,
        body: post.text,
        icon: post.authorPhotoURL || '/favicon.ico',
        click_action: `/jtt-news`
      },
      data: {
        title: `New JTT News from ${post.authorName}`,
        body: post.text,
        chatId: 'jtt-news' // Not a real chat, but helps identify the notification type
      }
    };

    const usersSnapshot = await admin.firestore().collection('users').get();
    const tokens: string[] = [];
    usersSnapshot.forEach(userDoc => {
      const userData = userDoc.data();
      // Don't send notification to the author of the post
      if (userData.fcmToken && userData.uid !== post.authorId) {
        tokens.push(userData.fcmToken);
      }
    });

    if (tokens.length > 0) {
        try {
          const response = await admin.messaging().sendToDevice(tokens, payload);
          // Clean up invalid tokens
          response.results.forEach((result, index) => {
              const error = result.error;
              if (error) {
                  console.error('Failure sending notification to', tokens[index], error);
                  if (error.code === 'messaging/invalid-registration-token' ||
                      error.code === 'messaging/registration-token-not-registered') {
                      const userSnapshot = usersSnapshot.docs.find(doc => doc.data().fcmToken === tokens[index]);
                      if(userSnapshot) {
                          userSnapshot.ref.update({ fcmToken: null });
                      }
                  }
              }
          });
        } catch (error) {
            console.error('Error sending JTT news notifications:', error);
        }
    }
  });
