// Custom service worker for push notifications
// This file is injected into the generated service worker by next-pwa

self.addEventListener('push', function(event) {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const { title, body, icon, badge, tag, data: notificationData } = data;

    const options = {
      body: body || 'You have a new notification',
      icon: icon || '/breakfastApp_favicon.png',
      badge: badge || '/breakfastApp_favicon.png',
      tag: tag,
      data: notificationData,
      vibrate: [100, 50, 100],
      requireInteraction: true,
    };

    event.waitUntil(
      self.registration.showNotification(title || 'Aston Breakfast Club', options)
    );
  } catch (error) {
    console.error('Error showing push notification:', error);
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
