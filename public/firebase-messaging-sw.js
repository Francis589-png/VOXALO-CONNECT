// Give the service worker a name
self.importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
self.importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// NOTE: This file should be in the 'public' folder

const firebaseConfig = {
  apiKey: "AIzaSyD5A3eoJms-tQIttDDHZKIsUTp2elSL3BY",
  authDomain: "voxalo-x.firebaseapp.com",
  projectId: "voxalo-x",
  storageBucket: "voxalo-x.firebasestorage.app",
  messagingSenderId: "218806636116",
  appId: "1:218806636116:web:2ec151f5500021b38067c1",
  databaseURL: "https://voxalo-x-default-rtdb.firebaseio.com"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Customize notification here
  const notificationTitle = payload.data.title;
  const notificationOptions = {
    body: payload.data.body,
    icon: payload.data.icon || '/favicon.ico',
    data: {
        url: `/?chatId=${payload.data.chatId}` // Pass the URL to open on click
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});


self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    const urlToOpen = event.notification.data.url;

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true,
        }).then((clientList) => {
            // If a window is already open, focus it
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise, open a new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
