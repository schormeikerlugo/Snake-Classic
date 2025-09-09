import { settings } from './settings.js';

const SFX_PATHS = {
    openModal: 'assets/audio/game/efectos/abrir-modal.ogg',
    bonus: 'assets/audio/game/efectos/bonus.wav',
    closeModal: 'assets/audio/game/efectos/cerrar-modal.ogg',
    eat: 'assets/audio/game/efectos/comer.wav',
    gameOver: 'assets/audio/game/efectos/game-over.wav',
    pause: 'assets/audio/game/efectos/pausa.ogg',
};

const sounds = {};
const baseVolume = 0.6; // Volumen base para todos los efectos

/**
 * Carga todos los efectos de sonido para que estén listos para reproducirse.
 */
function init() {
    for (const key in SFX_PATHS) {
        sounds[key] = new Audio(SFX_PATHS[key]);
    }
    setMasterVolume(settings.masterVolume);
}

/**
 * Ajusta el volumen de todos los efectos de sonido.
 * @param {number} volume - El volumen maestro (0.0 a 1.0).
 */
function setMasterVolume(volume) {
    settings.masterVolume = volume;
    for (const key in sounds) {
        sounds[key].volume = baseVolume * volume;
    }
}

/**
 * Reproduce un efecto de sonido.
 * @param {string} name - El nombre del sonido a reproducir (ej. 'eat', 'gameOver').
 */
function play(name) {
    if (!settings.sound || !sounds[name]) return;

    sounds[name].currentTime = 0;
    sounds[name].play().catch(e => console.warn(`No se pudo reproducir el sonido ${name}`))
}

// Inicializa los sonidos al cargar el módulo.
init();

// Exporta las funciones públicas.
export const sfx = { play, setMasterVolume };
