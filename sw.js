const CACHE_NAME = 'snake-game-v12';
const urlsToCache = [
  './',
  'index.html',
  'manifest.json',
  'styles/main.css',
  'styles/variables.css',
  'styles/base.css',
  'styles/animations.css',
  'styles/game.css',
  'styles/menu.css',
  'styles/modal.css',
  'js/main.js',
  'js/game.js',
  'js/constants.js',
  'js/utils.js',
  'js/audio.js',
  'js/menu.js',
  'js/modal.js',
  'js/settings.js',
  'js/game/gameLogic.js',
  'js/game/rendering.js',
  'assets/image/logo/logo.png',
  'assets/font/PixelifySans-VariableFont_wght.ttf',
  'assets/audio/menu/menu.mp3',
  'assets/audio/game/pista-01.mp3',
  'assets/image/icon/icon-192x192.png'
];

// Evento de instalación: se abre la caché y se añaden los archivos base.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierta');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento de fetch: responde desde la caché si es posible.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si el recurso está en la caché, lo devuelve.
        if (response) {
          return response;
        }
        // Si no, intenta obtenerlo de la red.
        return fetch(event.request);
      }
    )
  );
});

// Evento de activación: limpia cachés antiguas si es necesario.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Listen for a message from the client to skip waiting.
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});