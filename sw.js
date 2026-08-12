// ====== SERVICE WORKER PARA NOTIFICAÇÕES PUSH ======
self.addEventListener('install', (event) => {
    console.log('✅ Service Worker instalado!');
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker ativado!');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
    console.log('📨 Push recebido!', event);
    
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch (e) {
        data = { title: 'KZN MENU', body: 'Nova mensagem!' };
    }
    
    const title = data.title || '🔔 KZN MENU';
    const options = {
        body: data.body || 'Nova mensagem no chat!',
        icon: 'https://yt3.ggpht.com/pCQ6XhcUzMYgxDHA4Z2WZzHIN9B8O3HqCB_nfbqMYymlQqQ1cDvZc-kszyjePyEjV13qgqvwDbJK=s800-rw-nd-v1',
        badge: 'https://yt3.ggpht.com/pCQ6XhcUzMYgxDHA4Z2WZzHIN9B8O3HqCB_nfbqMYymlQqQ1cDvZc-kszyjePyEjV13qgqvwDbJK=s800-rw-nd-v1',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/'
        }
    };
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Notificação clicada!');
    event.notification.close();
    
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
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
