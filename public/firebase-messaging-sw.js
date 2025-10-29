
// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyD5A3eoJms-tQIttDDHZKIsUTp2elSL3BY",
    authDomain: "voxalo-x.firebaseapp.com",
    databaseURL: "https://voxalo-x-default-rtdb.firebaseio.com",
    projectId: "voxalo-x",
    storageBucket: "voxalo-x.appspot.com",
    messagingSenderId: "218806636116",
    appId: "1:218806636116:web:2ec151f5500021b38067c1"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon,
    sound: payload.notification.sound || '/notification.mp3', 
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = event.notification.data.url || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus().then(client => client.navigate(targetUrl));
            }
            return clients.openWindow(targetUrl);
        })
    );
});
