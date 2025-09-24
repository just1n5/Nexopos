// Service Worker para NexoPOS
const CACHE_NAME = 'nexopos-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/main.tsx',
  '/src/index.css'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Estrategia de cache: Network First con fallback a cache
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, la clonamos y guardamos en cache
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();

        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // Si falla la red, intentamos obtener del cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            
            // Si no está en cache y es una navegación, mostramos la página offline
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
          });
      })
  );
});

// Sincronización en segundo plano
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-sales') {
    event.waitUntil(syncSalesData());
  }
});

// Función para sincronizar datos de ventas
async function syncSalesData() {
  try {
    // Obtener ventas pendientes de sincronización desde IndexedDB
    const pendingSales = await getPendingSales();
    
    if (pendingSales.length > 0) {
      // Enviar ventas al servidor
      const response = await fetch('/api/sales/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sales: pendingSales })
      });

      if (response.ok) {
        // Marcar ventas como sincronizadas
        await markSalesAsSynced(pendingSales);
        
        // Notificar al usuario
        self.registration.showNotification('NexoPOS', {
          body: `${pendingSales.length} ventas sincronizadas exitosamente`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png'
        });
      }
    }
  } catch (error) {
    console.error('Error sincronizando ventas:', error);
  }
}

// Funciones auxiliares para IndexedDB (simplificadas)
async function getPendingSales() {
  // Aquí iría la lógica para obtener ventas de IndexedDB
  return [];
}

async function markSalesAsSynced(sales) {
  // Aquí iría la lógica para marcar ventas como sincronizadas en IndexedDB
  return true;
}

// Notificaciones push
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación de NexoPOS',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver detalles',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('NexoPOS', options)
  );
});

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    // Abrir la app y navegar a la sección relevante
    clients.openWindow('/');
  }
});

// Actualización del Service Worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
