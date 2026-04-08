const CACHE_NAME = 'snake-game-v3.0';
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
  'js/core/gameLogic/powerups.js',
  'js/core/rendering.js',
  // Rendering submodules (new/modified)
  'js/core/rendering/cell.js',
  'js/core/rendering/snake.js',
  'js/core/rendering/fx.js',
  'js/core/rendering/powerup.js',
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
  'js/utils/language.js',
  'js/utils/haptics.js',

  // Multiplayer
  'js/features/multiplayer/rooms.js',
  'js/features/multiplayer/roomActions.js',
  'js/features/multiplayer/roomState.js',
  'js/features/multiplayer/roomStore.js',
  'js/features/multiplayer/roomSync.js',
  'js/features/multiplayer/roomChat.js',
  'js/features/multiplayer/multiplayerUI.js',
  'js/features/multiplayer/game/multiplayerGame.js',
  'js/features/multiplayer/game/gameState.js',
  'js/features/multiplayer/game/canvas.js',
  'js/features/multiplayer/game/collision.js',
  'js/features/multiplayer/game/input.js',
  'js/features/multiplayer/game/renderer.js',
  'js/features/multiplayer/game/rematch.js',
  'js/features/multiplayer/game/gameView.js',

  // Multiplayer styles
  'styles/multiplayer.css',
  'styles/multiplayer-game.css',

  // Assets
  'assets/font/PixelifySans-VariableFont_wght.ttf',
  'assets/image/anonimo/anonimo.png',
  'assets/image/creditos/avatar.jpeg',
  'assets/image/icon/icon-192x192.png',
  'assets/image/icon/icon-512x512.png',
  'assets/image/icon/apple-touch-icon-120x120.png',
  'assets/image/icon/apple-touch-icon-152x152.png',
  'assets/image/icon/apple-touch-icon-167x167.png',
  'assets/image/icon/apple-touch-icon-180x180.png',
  'assets/image/icon/splash-750x1334.png',
  'assets/image/icon/splash-828x1792.png',
  'assets/image/icon/splash-1125x2436.png',
  'assets/image/icon/splash-1170x2532.png',
  'assets/image/icon/splash-1284x2778.png',
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

// Evento de fetch: estrategia según tipo de recurso.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // NUNCA cachear: API calls de Supabase, WebSockets, realtime
  if (
    url.pathname.startsWith('/rest/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/realtime/') ||
    url.pathname.startsWith('/storage/') ||
    url.hostname.includes('supabase') ||
    url.protocol === 'ws:' ||
    url.protocol === 'wss:'
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // JS files: network-first (para que los cambios se reflejen rápido)
  if (url.pathname.endsWith('.js')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Assets estáticos (CSS, imágenes, audio, fonts): cache-first
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response;
        return fetch(event.request).then(networkResponse => {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return networkResponse;
        });
      })
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