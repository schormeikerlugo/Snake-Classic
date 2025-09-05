import { showModal } from './modal.js';
import { settings } from './settings.js';
import { audioManager } from './audio.js';

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
        <p>Juego desarrollado por <strong>Schormeiker Lugo</strong>.</p>
        <p>¡Gracias por jugar!</p>
    `;
}

/**
 * Genera el contenido del DOM para la sección "Configuración".
 * @returns {DocumentFragment} - Un fragmento de documento con los elementos de configuración.
 */
function getSettingsContent() {
    const fragment = document.createDocumentFragment();
    const item = document.createElement('div');
    item.className = 'settings-item';
    item.innerHTML = `
        <span>Sonido (Efectos y Música)</span>
        <label class="switch">
            <input type="checkbox" id="sound-toggle">
            <span class="slider"></span>
        </label>
    `;
    const toggle = item.querySelector('#sound-toggle');
    toggle.checked = settings.sound;
    toggle.addEventListener('change', () => {
        settings.sound = toggle.checked;
        audioManager.updateMusicState();
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