const CACHE_NAME = 'snake-game-v0.8';
const urlsToCache = [
  // Core files
  './',
  'index.html',
  'manifest.json',
  'templates/mode-selection.html',

  // Styles
  'styles/main.css',
  'styles/loader.css',
  'styles/modal-selection.css',
  'styles/controls.css',
  'styles/mobile-views.css',
  'styles/game.css',
  'styles/animations.css',
  'styles/background.css',
  'styles/base.css',
  'styles/menu.css',
  'styles/modal.css',
  'styles/power-ups.css',
  'styles/update.css',
  'styles/variables.css',
  'styles/powerup-demos.css',


  // JavaScript
  'js/main.js',
  'js/config/colors.js',
  'js/config/constants.js',
  'js/config/powerups.js',
  'js/core/game.js',
  'js/core/gameLogic.js',
  'js/core/rendering.js',
  'js/features/auth.js',
  'js/features/chat.js',
  'js/features/ranking.js',
  'js/features/settings.js',
  'js/fx/particles.js',
  'js/fx/snakeEffect.js',
  'js/fx/animationManager.js',
  'js/lib/supabaseClient.js',
  'js/sound/audio.js',
  'js/sound/sfx.js',
  'js/ui/menu.js',
  'js/ui/mobile-views.js',
  'js/ui/modal.js',
  'js/ui/mode-selection.js',
  'js/ui/ui.js',
  'js/ui/update.js',
  'js/utils/utils.js',

  // Assets
  'assets/font/PixelifySans-VariableFont_wght.ttf',
  'assets/image/anonimo/anonimo.png',
  'assets/image/creditos/avatar.jpeg',
  'assets/image/icon/icon-192x192.png',
  'assets/image/logo/logo.png',
  
  // Audio - Menu
  'assets/audio/menu/menu.mp3',
 
  // Audio - Game Music
  'assets/audio/game/pista-01.mp3',
  'assets/audio/game/pista-02.mp3',
  'assets/audio/game/pista-03.mp3',
  'assets/audio/game/pista-04.mp3',

  // Audio - SFX
  'assets/audio/game/efectos/abrir-modal.ogg',
  'assets/audio/game/efectos/Bomba.mp3',
  'assets/audio/game/efectos/bonus.wav',
  'assets/audio/game/efectos/cerrar-modal.ogg',
  'assets/audio/game/efectos/comer.wav',
  'assets/audio/game/efectos/Duplicar.mp3',
  'assets/audio/game/efectos/Encoger.mp3',
  'assets/audio/game/efectos/game-over.wav',
  'assets/audio/game/efectos/Inmunidad.mp3',
  'assets/audio/game/efectos/Limpiar-Obstaculos.mp3',
  'assets/audio/game/efectos/pausa.ogg',
  'assets/audio/game/efectos/Ralentizar.mp3',

  //locales
 'assets/locales/en.json',
 'assets/locales/es.json',

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