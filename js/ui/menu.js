import { showModal } from './modal.js';
import { settings } from '../features/settings.js';
import { audioManager } from '../sound/audio.js';
import { sfx } from '../sound/sfx.js';
import { renderAuthForm } from './ui.js';
import { initAuth } from '../features/auth.js';
import { initRanking } from '../features/ranking.js';
import { initChat } from '../features/chat.js';
import { initModeSelection } from './mode-selection.js';
import { initializePowerupDemos } from './powerupDemos.js';
import { setLanguage, getTranslation, updateUI } from '../utils/language.js';

// Vistas principales
const menuView = document.getElementById('menu-view');
const gameView = document.getElementById('game-view');

// Botones del menú
const startBtn = document.getElementById('menu-start');
const howToPlayBtn = document.getElementById('menu-how-to-play');
const settingsBtn = document.getElementById('menu-settings');
const creditsBtn = document.getElementById('menu-credits');
const accountBtn = document.getElementById('menu-account');

/**
 * Genera el contenido del DOM para la sección "Cómo Jugar".
 * @param {HTMLElement} modalBody - El cuerpo del modal donde se renderizará el contenido.
 */
function renderHowToPlayContent(modalBody) {
    modalBody.innerHTML = `
        <div class="how-to-play-content">
            <div class="section">
                <h2 data-translate-key="howToPlayControlsTitle"></h2>
                <p data-translate-key="howToPlayControlsDesc1"></p>
                <p data-translate-key="howToPlayControlsDesc2"></p>
            </div>

            <div class="section">
                <h2 data-translate-key="howToPlayObjectiveTitle"></h2>
                <p data-translate-key="howToPlayObjectiveDesc1"></p>
                <p data-translate-key="howToPlayObjectiveDesc2"></p>
            </div>

            <div class="section">
                <h2 data-translate-key="howToPlayPowerUpsTitle"></h2>
                <p data-translate-key="howToPlayPowerUpsDesc"></p>
                <div id="powerup-demos-container"></div>
            </div>
        </div>
    `;

    const demosContainer = modalBody.querySelector('#powerup-demos-container');
    initializePowerupDemos(demosContainer);
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
            <p data-translate-key="creditsRole"></p>
        </div>
      <p data-translate-key="creditsLine1"></p>
        <p data-translate-key="creditsLine2"></p>
        <p data-translate-key="creditsLine3"></p>
        <p data-translate-key="creditsLine4"></p>
        <p data-translate-key="creditsDonation"></p>
        <p style="font-weight: bold; font-size: 1.2em;" data-translate-key="creditsBitcoin"></p>
        <p style="font-weight: bold; font-size: 1.2em;" data-translate-key="creditsUsdt"></p>
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
        <span data-translate-key="soundToggleLabel">Sonido (Efectos y Música)</span>
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
        <span data-translate-key="volumeLabel">Volumen</span>
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

    // Toggle de Obstáculos
    item = document.createElement('div');
    item.className = 'settings-item';
    item.innerHTML = `
        <span data-translate-key="obstaclesLabel">Modo Obstáculos</span>
        <label class="switch">
            <input type="checkbox" id="obstacles-toggle">
            <span class="slider"></span>
        </label>
    `;
    const obstaclesToggle = item.querySelector('#obstacles-toggle');
    obstaclesToggle.checked = settings.obstacles;
    obstaclesToggle.addEventListener('change', () => {
        settings.obstacles = obstaclesToggle.checked;
    });
    fragment.appendChild(item);

    // Selector de Idioma
    item = document.createElement('div');
    item.className = 'settings-item';
    item.innerHTML = `
        <span data-translate-key="languageLabel">Idioma</span>
        <div class="language-buttons">
            <button id="lang-es" class="lang-btn">Español</button>
            <button id="lang-en" class="lang-btn">English</button>
        </div>
    `;
    const langEsBtn = item.querySelector('#lang-es');
    const langEnBtn = item.querySelector('#lang-en');
    langEsBtn.addEventListener('click', () => setLanguage('es'));
    langEnBtn.addEventListener('click', () => setLanguage('en'));
    fragment.appendChild(item);

    return fragment;
}

async function showModeSelection(game) {
    const response = await fetch('templates/mode-selection.html');
    const html = await response.text();
    showModal(getTranslation('modeSelectionTitle'), (modalBody) => {
        modalBody.innerHTML = html;
        initModeSelection(game);
        updateUI();
    });
}

/**
 * Inicializa el menú, configurando los listeners para los botones.
 * @param {Game} game - La instancia del juego para poder iniciarlo.
 */
export function initMenu(game) {
    const backToMenuBtn = document.getElementById('back-to-menu-btn');

    startBtn.addEventListener('click', () => {
        showModeSelection(game);
    });

    howToPlayBtn.addEventListener('click', () => {
        showModal(getTranslation('howToPlay'), (modalBody) => {
            renderHowToPlayContent(modalBody);
            updateUI();
        });
    });

    creditsBtn.addEventListener('click', () => {
        showModal(getTranslation('credits'), (modalBody) => {
            modalBody.innerHTML = getCreditsContent();
            updateUI();
        });
    });

    settingsBtn.addEventListener('click', () => {
        const modalTitle = document.getElementById('modal-title');
        if (modalTitle) modalTitle.dataset.translateKey = 'settings';
        showModal(getTranslation('settings'), getSettingsContent());
    });

    accountBtn.addEventListener('click', () => {
        const modalTitle = document.getElementById('modal-title');
        if (modalTitle) modalTitle.dataset.translateKey = 'account';
        showModal(getTranslation('account'), (modalBody) => {
            renderAuthForm(modalBody);
            initAuth();
        });
    });

    backToMenuBtn.addEventListener('click', () => {
        game.stop();
        audioManager.playMenuMusic();
        gameView.classList.add('hidden');
        menuView.classList.remove('hidden');
    });
}