self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png', // Optional: if you have an icon
      data: {
        url: data.url
      }
    };
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Also broadcast payload to open clients so in-app UI can reflect updated content
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(
      clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(function(clientList) {
        for (const client of clientList) {
          try {
            client.postMessage({ type: 'push', payload: data });
          } catch (e) {
            // ignore
          }
        }
      })
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
