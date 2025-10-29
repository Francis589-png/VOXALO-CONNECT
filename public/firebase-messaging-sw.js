self.addEventListener('push', function(event) {
    if (event.data) {
        const payload = event.data.json();
        const title = payload.notification.title;
        const options = {
            body: payload.notification.body,
            icon: payload.notification.icon || '/icon-192x192.png',
            badge: payload.notification.badge || '/badge-72x72.png',
            sound: '/notification.mp3', // Path to your sound file
            data: {
                click_action: payload.notification.click_action
            }
        };

        event.waitUntil(self.registration.showNotification(title, options));
    }
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    const targetUrl = event.notification.data.click_action || '/';

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(function(clientList) {
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if (client.url == targetUrl && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
