import { showModal } from './modal.js';
import { settings } from '../features/settings.js';
import { audioManager } from '../sound/audio.js';
import { sfx } from '../sound/sfx.js';
import { renderAuthForm } from './ui.js';
import { initAuth } from '../features/auth.js';
import { initRanking } from '../features/ranking.js';
import { initChat } from '../features/chat.js';

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
 * Genera el contenido HTML para la sección "Cómo Jugar".
 * @returns {string} - El HTML del contenido.
 */
function getHowToPlayContent() {
    return `
        <div class="how-to-play-content">
            <div class="section">
                <h2>Controles</h2>
                <p>Usa las <strong>teclas de flecha</strong> o <strong>WASD</strong> para mover la serpiente.</p>
                <p>Usa la <strong>barra espaciadora</strong> para pausar el juego.</p>
            </div>

            <div class="section">
                <h2>Objetivo</h2>
                <p>Come la comida para crecer y sumar puntos. ¡Pero cuidado! Por cada <strong>10 puntos</strong>, la serpiente aumentará su velocidad.</p>
                <p>Evita chocar contra las paredes, los <strong>obstáculos</strong> (bloques grises que aparecen aleatoriamente) o tu propio cuerpo.</p>
            </div>

            <div class="section">
                <h2>Power-Ups</h2>
                <p>Recoge las figuras geométricas para activar habilidades especiales:</p>
                <div class="power-ups-table-container">
                    <table class="power-ups-table">
                        <thead>
                            <tr>
                                <th>Power-Up</th>
                                <th>Forma</th>
                                <th>Efecto</th>
                                <th>Duración</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Ralentizar</strong></td>
                                <td><div class="shape triangle blue"></div></td>
                                <td>Reduce la velocidad de la serpiente temporalmente.</td>
                                <td>10 seg</td>
                            </tr>
                            <tr>
                                <td><strong>Puntos Dobles</strong></td>
                                <td><div class="shape quadrilateral yellow"></div></td>
                                <td>Duplica los puntos que obtienes por cada comida.</td>
                                <td>15 seg</td>
                            </tr>
                            <tr>
                                <td><strong>Inmunidad</strong></td>
                                <td><div class="shape hexagon green"></div></td>
                                <td>Te vuelve inmune a los choques. ¡Atraviésalo todo!</td>
                                <td>10 seg</td>
                            </tr>
                            <tr>
                                <td><strong>Encoger</strong></td>
                                <td><div class="shape circle purple"></div></td>
                                <td>Reduce el tamaño de la serpiente.</td>
                                <td>Instantáneo</td>
                            </tr>
                            <tr>
                                <td><strong>Limpiar Obstáculos</strong></td>
                                <td><div class="shape star red"></div></td>
                                <td>Elimina todos los obstáculos del tablero.</td>
                                <td>Instantáneo</td>
                            </tr>
                            <tr>
                                <td><strong>Bomba</strong></td>
                                <td><div class="shape square gray"></div></td>
                                <td>¡Cuidado! Resta puntos y genera nueva comida.</td>
                                <td>Instantáneo</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
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
            <p>🎨 UI/UX Dev Designer</p>
        </div>
      <p>Pixel por pixel, trazo por trazo, cada interfaz y sonido de este juego nace de una obsesión: transformar la nostalgia en futuro.</p>
        <p>Con más de seis años diseñando productos digitales en tecnología, Web3 y videojuegos, mi enfoque combina precisión modular, estética retro-futurista y una profunda empatía por el jugador. No solo diseño pantallas: construyo atmósferas, flujos intuitivos y microinteracciones que cuentan historias sin palabras.</p>
        <p>Trabajo con sistemas visuales que respiran coherencia, wireframes que anticipan decisiones, y procesos que respetan tanto la lógica como la emoción. Cada elemento aquí —desde el brillo de un píxel hasta el eco de un sonido— está pensado para que la experiencia sea clara, envolvente y memorable.</p>
        <p>Este Snake no es solo un juego. Es una cápsula de diseño, una declaración visual, y una carta de amor a quienes creen que lo digital también puede ser arte.</p>
        <p>🪙 Si te gustó este proyecto y quieres apoyar su evolución, puedes hacer una donación para ayudarme a seguir desarrollando nuevas variantes visuales, efectos pixelart, microinteracciones y compatibilidad avanzada con entornos Linux. Cada aporte impulsa la creación de experiencias más pulidas, modulares y accesibles para todos. ¡Gracias por ser parte de esta misión retro-futurista! 💜.</p>
        <p style="font-weight: bold; font-size: 1.2em;" >Bitcoin : bc1qngxlgsz3tj6v9kkgumv0fnrf7fsfn9wjesjghr</p>
        <p style="font-weight: bold; font-size: 1.2em;">USDT (TRON): TL3Vwuyf1iA86nB6vzXiNbtgdYBrWLxEEi</p>
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

    // Toggle de Obstáculos
    item = document.createElement('div');
    item.className = 'settings-item';
    item.innerHTML = `
        <span>Modo Obstáculos</span>
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
        
        // Inicia la música y los componentes en tiempo real
        audioManager.playGameMusic();
        initRanking(document.getElementById('ranking-container'));
        initChat();

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

    accountBtn.addEventListener('click', () => {
        showModal('Cuenta', (modalBody) => {
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