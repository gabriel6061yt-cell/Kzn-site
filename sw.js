// Service Worker Mínimo
self.addEventListener('install', function() {
  console.log('SW instalado');
  self.skipWaiting();
});

self.addEventListener('activate', function() {
  console.log('SW ativado');
  self.clients.claim();
});

self.addEventListener('push', function(event) {
  console.log('Push recebido');
  const dados = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(dados.title || 'KZN MENU', {
      body: dados.body || 'Nova mensagem!',
      icon: 'https://yt3.ggpht.com/pCQ6XhcUzMYgxDHA4Z2WZzHIN9B8O3HqCB_nfbqMYymlQqQ1cDvZc-kszyjePyEjV13qgqvwDbJK=s800-rw-nd-v1'
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
