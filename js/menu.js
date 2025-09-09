import { showModal } from './modal.js';
import { settings } from './settings.js';
import { audioManager } from './audio.js';
import { sfx } from './sfx.js';

// Vistas principales
const menuView = document.getElementById('menu-view');
const gameView = document.getElementById('game-view');

// Botones del menú
const startBtn = document.getElementById('menu-start');
const howToPlayBtn = document.getElementById('menu-how-to-play');
const settingsBtn = document.getElementById('menu-settings');
const creditsBtn = document.getElementById('menu-credits');

/**
 * Genera el contenido HTML para la sección "Cómo Jugar".
 * @returns {string} - El HTML del contenido.
 */
function getHowToPlayContent() {
    return `
        <p>Usa las <strong>teclas de flecha</strong> o <strong>WASD</strong> para mover la serpiente.</p>
        <p>El objetivo es comer la comida (puntos rojos) para crecer y sumar puntos.</p>
        <p>Evita chocar contra las paredes o contra tu propio cuerpo.</p>
        <p>Usa la <strong>barra espaciadora</strong> para pausar el juego.</p>
    `;
}

/**
 * Genera el contenido HTML para la sección "Créditos".
 * @returns {string} - El HTML del contenido.
 */
function getCreditsContent() {
    return `
        <div style="text-align: center; margin-bottom: 20px;">
            <img src="assets/image/creditos/avatar.jpeg" alt="Schormeiker Lugo" style="max-width: 150px; border-radius: 50%; margin-bottom: 10px;">
            <p style="font-weight: bold; font-size: 1.2em;">Schormeiker Lugo</p>
            <p>🎨 UI/UX Designer</p>
        </div>
      <p>Pixel por pixel, trazo por trazo, cada interfaz y sonido de este juego nace de una obsesión: transformar la nostalgia en futuro.</p>
        <p>Con más de seis años diseñando productos digitales en tecnología, Web3 y videojuegos, mi enfoque combina precisión modular, estética retro-futurista y una profunda empatía por el jugador. No solo diseño pantallas: construyo atmósferas, flujos intuitivos y microinteracciones que cuentan historias sin palabras.</p>
        <p>Trabajo con sistemas visuales que respiran coherencia, wireframes que anticipan decisiones, y procesos que respetan tanto la lógica como la emoción. Cada elemento aquí —desde el brillo de un píxel hasta el eco de un sonido— está pensado para que la experiencia sea clara, envolvente y memorable.</p>
        <p>Este Snake no es solo un juego. Es una cápsula de diseño, una declaración visual, y una carta de amor a quienes creen que lo digital también puede ser arte.</p>
    `;
}

/**
 * Genera el contenido del DOM para la sección "Configuración".
 * @returns {DocumentFragment} - Un fragmento de documento con los elementos de configuración.
 */
function getSettingsContent() {
    const fragment = document.createDocumentFragment();

    // Toggle de Sonido
    let item = document.createElement('div');
    item.className = 'settings-item';
    item.innerHTML = `
        <span>Sonido (Efectos y Música)</span>
        <label class="switch">
            <input type="checkbox" id="sound-toggle">
            <span class="slider"></span>
        </label>
    `;
    const soundToggle = item.querySelector('#sound-toggle');
    soundToggle.checked = settings.sound;
    soundToggle.addEventListener('change', () => {
        settings.sound = soundToggle.checked;
        audioManager.updateMusicState();
    });
    fragment.appendChild(item);

    // Control de Volumen Maestro
    item = document.createElement('div');
    item.className = 'settings-item';
    item.innerHTML = `
        <span>Volumen</span>
        <input type="range" id="volume-slider" min="0" max="1" step="0.01">
    `;
    const volumeSlider = item.querySelector('#volume-slider');
    volumeSlider.value = settings.masterVolume;
    volumeSlider.addEventListener('input', () => {
        const newVolume = parseFloat(volumeSlider.value);
        audioManager.setMasterVolume(newVolume);
        sfx.setMasterVolume(newVolume);
        localStorage.setItem('snake_volume', newVolume);
    });
    fragment.appendChild(item);

    return fragment;
}

/**
 * Inicializa el menú, configurando los listeners para los botones.
 * @param {Game} game - La instancia del juego para poder iniciarlo.
 */
export function initMenu(game) {
    const backToMenuBtn = document.getElementById('back-to-menu-btn');

    startBtn.addEventListener('click', () => {
        menuView.classList.add('hidden');
        gameView.classList.remove('hidden');
        audioManager.playGameMusic();
        game.startGame();
    });

    howToPlayBtn.addEventListener('click', () => {
        showModal('Cómo Jugar', getHowToPlayContent());
    });

    creditsBtn.addEventListener('click', () => {
        showModal('Créditos', getCreditsContent());
    });

    settingsBtn.addEventListener('click', () => {
        showModal('Configuración', getSettingsContent());
    });

    backToMenuBtn.addEventListener('click', () => {
        game.stop();
        audioManager.playMenuMusic();
        gameView.classList.add('hidden');
        menuView.classList.remove('hidden');
    });
}