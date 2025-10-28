/* global self */
self.addEventListener('push', function(event) {
  // Default handler (FCM shows notifications automatically via notification payload)
});

self.addEventListener('notificationclick', function(event) {
  const url = event.notification?.data?.url || event.notification?.data?.FCM_MSG?.data?.url || '/';
  event.notification.close();
  event.waitUntil(self.clients.openWindow(url));
});
