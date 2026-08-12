self.addEventListener('install', function(e) {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function(e) {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('push', function(e) {
  var data = {};
  if (e.data) {
    try { data = e.data.json(); } catch (er) {}
  }
  e.waitUntil(
    self.registration.showNotification(data.title || 'KZN MENU', {
      body: data.body || 'Nova mensagem!',
      icon: 'https://yt3.ggpht.com/pCQ6XhcUzMYgxDHA4Z2WZzHIN9B8O3HqCB_nfbqMYymlQqQ1cDvZc-kszyjePyEjV13qgqvwDbJK=s800-rw-nd-v1'
    })
  );
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(clients.openWindow('/'));
});
