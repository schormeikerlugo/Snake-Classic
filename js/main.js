import { Game } from './game.js';
import { initMenu } from './menu.js';
import { audioManager } from './audio.js';
import { sfx } from './sfx.js';

// Se importa modal.js para asegurar que sus event listeners se registren.
import './modal.js';

document.addEventListener('DOMContentLoaded', () => {
  const splashScreen = document.getElementById('splash-screen');
  const menuView = document.getElementById('menu-view');
  const enterBtn = document.getElementById('enter-btn');

  // Crea la instancia del juego, pero no la inicia.
  const game = new Game();

  // Inicializa los listeners del menú.
  initMenu(game);

  // Listener para el botón de la pantalla de inicio
  enterBtn.addEventListener('click', async () => {
    // Inicializa el AudioContext y carga los SFX después de la interacción del usuario
    audioManager.initAudioContext();
    await sfx.init(); // Esperar a que los SFX se carguen

    // Oculta la pantalla de inicio y muestra el menú
    splashScreen.classList.add('hidden');
    menuView.classList.remove('hidden');

    // Inicia la música del menú.
    audioManager.playMenuMusic();
  }, { once: true }); // El listener se ejecuta solo una vez.
});
