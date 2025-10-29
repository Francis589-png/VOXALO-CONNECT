// This file must be in the public folder.

importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyD5A3eoJms-tQIttDDHZKIsUTp2elSL3BY",
    authDomain: "voxalo-x.firebaseapp.com",
    databaseURL: "https://voxalo-x-default-rtdb.firebaseio.com",
    projectId: "voxalo-x",
    storageBucket: "voxalo-x.firebasestorage.app",
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
    icon: payload.notification.icon || '/icon-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
