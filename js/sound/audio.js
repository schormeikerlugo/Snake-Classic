import { settings } from '../features/settings.js';

/**
 * Gestiona la reproducción de la música de fondo utilizando Web Audio API.
 */
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.menuMusicElement = null;
        this.gameMusicElement = null;

        this.menuMusicSource = null;
        this.gameMusicSource = null;

        this.menuMusicGain = null;
        this.gameMusicGain = null;
        this.masterGain = null; // Controla el volumen general de la música

        this.currentTrack = null; // Referencia al elemento HTMLAudioElement que está sonando

        this.baseMenuVolume = 0.5;
        this.baseGameVolume = 0.5;
    }

    /**
     * Inicializa el AudioContext y crea los nodos de audio.
     * Debe llamarse después de la primera interacción del usuario.
     */
    initAudioContext() {
        if (this.audioContext) return; // Ya inicializado

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Crear elementos HTMLAudioElement
        this.menuMusicElement = new Audio('assets/audio/menu/menu.mp3');
        this.gameMusicElement = new Audio('assets/audio/game/pista-01.mp3');

        this.menuMusicElement.loop = true;
        this.gameMusicElement.loop = true;

        // Crear nodos de fuente a partir de los elementos de audio
        this.menuMusicSource = this.audioContext.createMediaElementSource(this.menuMusicElement);
        this.gameMusicSource = this.audioContext.createMediaElementSource(this.gameMusicElement);

        // Crear nodos de ganancia para cada pista y para el volumen maestro
        this.menuMusicGain = this.audioContext.createGain();
        this.gameMusicGain = this.audioContext.createGain();
        this.masterGain = this.audioContext.createGain();

        // Conectar nodos: Fuente -> Ganancia de pista -> Ganancia maestra -> Destino
        this.menuMusicSource.connect(this.menuMusicGain);
        this.menuMusicGain.connect(this.masterGain);

        this.gameMusicSource.connect(this.gameMusicGain);
        this.gameMusicGain.connect(this.masterGain);

        this.masterGain.connect(this.audioContext.destination);

        // Establecer volúmenes iniciales
        this.menuMusicGain.gain.value = this.baseMenuVolume;
        this.gameMusicGain.gain.value = this.baseGameVolume;
        this.setMasterVolume(settings.masterVolume); // Aplica el volumen maestro guardado

        // Intentar reanudar el contexto de audio si está suspendido (común en iOS)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(e => console.warn("Error al reanudar AudioContext:", e));
        }
    }

    /**
     * Establece el volumen maestro para toda la música.
     * @param {number} volume - El volumen maestro (0.0 a 1.0).
     */
    setMasterVolume(volume) {
        settings.masterVolume = volume;
        if (this.masterGain) {
            this.masterGain.gain.value = volume;
        }
    }

    /**
     * Reproduce una pista de audio, deteniendo cualquier otra que esté sonando.
     * @param {HTMLAudioElement} element - El elemento HTMLAudioElement a reproducir.
     * @private
     */
    _play(element) {
        if (!this.audioContext) {
            console.warn("AudioContext no inicializado. Llama a initAudioContext() primero.");
            return;
        }
        if (this.currentTrack === element) return;
        if (!settings.sound) return;

        this.stopAllMusic();
        element.play().catch(e => console.warn("La reproducción de audio fue impedida por el navegador:", e));
        this.currentTrack = element;

        // Asegurarse de que el contexto esté corriendo
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(e => console.warn("Error al reanudar AudioContext durante _play:", e));
        }
    }

    /**
     * Inicia la música del menú.
     */
    playMenuMusic() {
        this._play(this.menuMusicElement);
    }

    /**
     * Inicia la música del juego.
     */
    playGameMusic() {
        this._play(this.gameMusicElement);
    }

    /**
     * Detiene toda la música y reinicia su tiempo.
     */
    stopAllMusic() {
        if (this.menuMusicElement) {
            this.menuMusicElement.pause();
            this.menuMusicElement.currentTime = 0;
        }
        if (this.gameMusicElement) {
            this.gameMusicElement.pause();
            this.gameMusicElement.currentTime = 0;
        }
        this.currentTrack = null;
    }

    /**
     * Reduce el volumen de la música del juego al 10% del volumen base.
     */
    duckGameMusic() {
        if (!this.gameMusicGain || !this.audioContext) return;
        const targetVolume = this.baseGameVolume * 0.1; // 10% del volumen base
        this.fadeVolume(this.gameMusicGain, targetVolume, 200); // Atenuar en 200ms
    }

    /**
     * Restaura el volumen de la música del juego al 100% del volumen base.
     */
    restoreGameMusic() {
        if (!this.gameMusicGain || !this.audioContext) return;
        const targetVolume = this.baseGameVolume; // 100% del volumen base
        this.fadeVolume(this.gameMusicGain, targetVolume, 500); // Restaurar en 500ms
    }

    /**
     * Transiciona suavemente el volumen de un GainNode.
     * @param {GainNode} gainNode - El nodo de ganancia cuyo volumen se va a transicionar.
     * @param {number} targetValue - El valor final deseado para la ganancia (0.0 a 1.0).
     * @param {number} duration - La duración de la transición en milisegundos.
     * @returns {Promise<void>} - Una promesa que se resuelve cuando la transición ha terminado.
     */
    fadeVolume(gainNode, targetValue, duration) {
        if (!gainNode || !this.audioContext) return Promise.resolve();

        const now = this.audioContext.currentTime;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.linearRampToValueAtTime(targetValue, now + duration / 1000);

        return new Promise(resolve => {
            setTimeout(resolve, duration);
        });
    }

    /**
     * Actualiza el estado de la música (reproduciendo o parada) según la configuración de sonido.
     */
    updateMusicState() {
        if (!this.audioContext) return; // No hacer nada si no está inicializado

        if (settings.sound) {
            if (this.currentTrack) {
                this.currentTrack.play().catch(e => console.warn("La reproducción de audio fue impedida por el navegador."));
            }
            // Asegurarse de que el contexto esté corriendo
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().catch(e => console.warn("Error al reanudar AudioContext durante updateMusicState:", e));
            }
        } else {
            this.stopAllMusic();
            if (this.audioContext.state === 'running') {
                this.audioContext.suspend().catch(e => console.warn("Error al suspender AudioContext:", e));
            }
        }
    }
}

export const audioManager = new AudioManager();