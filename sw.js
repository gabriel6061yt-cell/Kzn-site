// ====== SERVICE WORKER SIMPLES E FUNCIONAL ======
self.addEventListener('install', function(event) {
    console.log('✅ Service Worker instalado!');
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    console.log('✅ Service Worker ativado!');
    return self.clients.claim();
});

self.addEventListener('push', function(event) {
    console.log('📨 Push recebido!', event);
    
    let data = {
        title: 'KZN MENU',
        body: 'Nova mensagem!',
        icon: 'https://yt3.ggpht.com/pCQ6XhcUzMYgxDHA4Z2WZzHIN9B8O3HqCB_nfbqMYymlQqQ1cDvZc-kszyjePyEjV13qgqvwDbJK=s800-rw-nd-v1'
    };
    
    if (event.data) {
        try {
            const parsed = event.data.json();
            data.title = parsed.title || data.title;
            data.body = parsed.body || data.body;
            data.icon = parsed.icon || data.icon;
        } catch (e) {
            console.warn('Erro ao parsear dados:', e);
        }
    }
    
    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.icon,
        vibrate: [200, 100, 200],
        data: {
            url: '/'
        }
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    console.log('🔔 Notificação clicada!');
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('/')
    );
});
