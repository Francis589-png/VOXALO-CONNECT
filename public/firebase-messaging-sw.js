
// Import and initialize the Firebase SDK
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging/sw";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5A3eoJms-tQIttDDHZKIsUTp2elSL3BY",
  authDomain: "voxalo-x.firebaseapp.com",
  projectId: "voxalo-x",
  storageBucket: "voxalo-x.firebasestorage.app",
  messagingSenderId: "218806636116",
  appId: "1:218806636116:web:2ec151f5500021b38067c1",
  databaseURL: "https://voxalo-x-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// This is the background message handler.
// It's called when the app is in the background or closed and a message is received.
self.addEventListener('push', (event) => {
  const payload = event.data.json();
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon,
    data: {
        url: payload.data.url // Pass the URL to the click handler
    }
  };

  event.waitUntil(self.registration.showNotification(notificationTitle, notificationOptions));
});

// This handles the click event on the notification.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
