import { settings } from '../features/settings.js';
import { audioManager } from './audio.js'; // Importar el audioManager para acceder al AudioContext

const SFX_PATHS = {
    openModal: 'assets/audio/game/efectos/abrir-modal.ogg',
    bonus: 'assets/audio/game/efectos/bonus.wav',
    closeModal: 'assets/audio/game/efectos/cerrar-modal.ogg',
    eat: 'assets/audio/game/efectos/comer.wav',
    gameOver: 'assets/audio/game/efectos/game-over.wav',
    pause: 'assets/audio/game/efectos/pausa.ogg',
};

const sounds = {}; // Almacenará los AudioBufferSourceNode
const baseVolume = 0.6; // Volumen base para todos los efectos
let sfxMasterGain = null; // Nodo de ganancia maestro para SFX

/**
 * Carga todos los efectos de sonido para que estén listos para reproducirse.
 * Debe llamarse después de que audioManager.initAudioContext() haya sido llamado.
 */
async function init() {
    if (!audioManager.audioContext) {
        console.error("AudioContext no inicializado en audioManager. Llama a audioManager.initAudioContext() primero.");
        return;
    }

    sfxMasterGain = audioManager.audioContext.createGain();
    sfxMasterGain.connect(audioManager.audioContext.destination);

    const promises = [];
    for (const key in SFX_PATHS) {
        const path = SFX_PATHS[key];
        promises.push(fetch(path)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => audioManager.audioContext.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                sounds[key] = audioBuffer;
            })
            .catch(e => console.error(`Error al cargar o decodificar ${path}:`, e))
        );
    }
    await Promise.all(promises);
    setMasterVolume(settings.masterVolume);
}

/**
 * Ajusta el volumen de todos los efectos de sonido.
 * @param {number} volume - El volumen maestro (0.0 a 1.0).
 */
function setMasterVolume(volume) {
    settings.masterVolume = volume;
    if (sfxMasterGain) {
        sfxMasterGain.gain.value = baseVolume * volume;
    }
}

/**
 * Reproduce un efecto de sonido.
 * @param {string} name - El nombre del sonido a reproducir (ej. 'eat', 'gameOver').
 */
function play(name) {
    if (!settings.sound || !sounds[name] || !audioManager.audioContext || !sfxMasterGain) return;

    const source = audioManager.audioContext.createBufferSource();
    source.buffer = sounds[name];
    source.connect(sfxMasterGain);
    source.start(0);

    // Asegurarse de que el contexto esté corriendo (para iOS)
    if (audioManager.audioContext.state === 'suspended') {
        audioManager.audioContext.resume().catch(e => console.warn("Error al reanudar AudioContext durante SFX play:", e));
    }
}

// Exporta las funciones públicas.
export const sfx = { init, play, setMasterVolume };
