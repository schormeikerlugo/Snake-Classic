import { Game } from './core/game.js';
import { initMenu } from './ui/menu.js';
import { audioManager } from './sound/audio.js';
import { sfx } from './sound/sfx.js';
import { registerServiceWorker } from './ui/update.js';

// Se importa modal.js para asegurar que sus event listeners se registren.
import './ui/modal.js';
import './ui/mobile-views.js'; // Maneja la lógica de las vistas móviles

document.addEventListener('DOMContentLoaded', () => {
    registerServiceWorker();
    const splashScreen = document.getElementById('splash-screen');
    const menuView = document.getElementById('menu-view');
    const enterBtn = document.getElementById('enter-btn');

    // Crea la instancia del juego, pero no la inicia.
    const game = new Game();

    // Inicializa los listeners del menú.
    initMenu(game);

    // Listener para el botón de la pantalla de inicio
    if (enterBtn) {
        enterBtn.addEventListener('click', async () => {
            // Inicializa el AudioContext y carga los SFX después de la interacción del usuario
            audioManager.initAudioContext();
            sfx.init(); // La carga de SFX se inicia en segundo plano, sin bloquear.

            // Oculta la pantalla de inicio y muestra el menú
            if (splashScreen) splashScreen.classList.add('hidden');
            if (menuView) {
                menuView.classList.remove('hidden');
                menuView.classList.add('glitch-effect');
                setTimeout(() => {
                    menuView.classList.remove('glitch-effect');
                }, 500); // La duración debe coincidir con la animación en CSS
            }

            // --- Solicitud de Pantalla Completa ---
            const docEl = document.documentElement;
            if (window.innerWidth <= 768) { // Solo en dispositivos considerados móviles
                    if (docEl.requestFullscreen) {
                            docEl.requestFullscreen().catch(err => {
                                    console.log(`No se pudo activar el modo de pantalla completa: ${err.message}`);
                            });
                    } else if (docEl.mozRequestFullScreen) { // Firefox
                            docEl.mozRequestFullScreen();
                    } else if (docEl.webkitRequestFullscreen) { // Chrome, Safari & Opera
                            docEl.webkitRequestFullscreen();
                    } else if (docEl.msRequestFullscreen) { // IE/Edge
                            docEl.msRequestFullscreen();
                    }
            }

            // Inicia la música del menú.
            audioManager.playMenuMusic();
        }, { once: true }); // El listener se ejecuta solo una vez.
    }
});
