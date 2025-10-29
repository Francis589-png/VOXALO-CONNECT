
// This file needs to be in the public directory
self.addEventListener('push', function (event) {
  const data = event.data.json();
  const title = data.title || 'New Message';
  const options = {
    body: data.body,
    icon: data.icon || '/favicon.ico',
    badge: data.badge,
    sound: '/notification.mp3', // Path to your sound file
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
