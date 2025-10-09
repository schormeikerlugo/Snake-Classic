import { settings } from '../features/settings.js';

/**
 * Gestiona la reproducción de la música de fondo utilizando Web Audio API.
 */
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.menuMusicElement = null;

        this.gameMusicTracks = [
            'assets/audio/game/pista-01.mp3',
            'assets/audio/game/pista-02.mp3',
            'assets/audio/game/pista-03.mp3',
            'assets/audio/game/pista-04.mp3',
        ];
        this.gameMusicElements = [];
        this.currentTrackIndex = -1;

        this.menuMusicSource = null;
        this.gameMusicSources = [];

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

        // Crear nodos de ganancia para cada pista y para el volumen maestro
        this.menuMusicGain = this.audioContext.createGain();
        this.gameMusicGain = this.audioContext.createGain();
        this.masterGain = this.audioContext.createGain();

        // Conectar la ganancia maestra al destino
        this.masterGain.connect(this.audioContext.destination);

        // Conectar ganancias de pista a la ganancia maestra
        this.menuMusicGain.connect(this.masterGain);
        this.gameMusicGain.connect(this.masterGain);

        // Crear y configurar música del menú
        this.menuMusicElement = new Audio('assets/audio/menu/menu.mp3');
        this.menuMusicElement.loop = true;
        this.menuMusicSource = this.audioContext.createMediaElementSource(this.menuMusicElement);
        this.menuMusicSource.connect(this.menuMusicGain);

        // Crear y configurar música del juego (playlist)
        this.gameMusicTracks.forEach(trackPath => {
            const audioEl = new Audio(trackPath);
            audioEl.loop = false;
            audioEl.addEventListener('ended', () => this.playNextGameTrack());
            this.gameMusicElements.push(audioEl);

            const source = this.audioContext.createMediaElementSource(audioEl);
            source.connect(this.gameMusicGain);
            this.gameMusicSources.push(source);
        });

        // Establecer volúmenes iniciales
        this.menuMusicGain.gain.value = this.baseMenuVolume;
        this.gameMusicGain.gain.value = this.baseGameVolume;
        this.setMasterVolume(settings.masterVolume);

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
        if (!this.audioContext || !element) return;
        if (this.currentTrack === element && !element.paused) return;
        if (!settings.sound) return;

        this.stopAllMusic();

        element.play().catch(e => console.warn("La reproducción de audio fue impedida por el navegador:", e));
        this.currentTrack = element;

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
     * Inicia la música del juego con una pista aleatoria.
     */
    playGameMusic() {
        if (this.gameMusicElements.length === 0) return;
        
        let nextTrackIndex = this.currentTrackIndex;
        if (this.gameMusicElements.length > 1) {
            while (nextTrackIndex === this.currentTrackIndex) {
                nextTrackIndex = Math.floor(Math.random() * this.gameMusicElements.length);
            }
        }
        this.currentTrackIndex = nextTrackIndex;
        this._play(this.gameMusicElements[this.currentTrackIndex]);
    }

    /**
     * Reproduce la siguiente pista aleatoria del juego.
     */
    playNextGameTrack() {
        this.playGameMusic();
    }

    /**
     * Detiene toda la música y reinicia su tiempo.
     */
    stopAllMusic() {
        if (this.menuMusicElement && !this.menuMusicElement.paused) {
            this.menuMusicElement.pause();
            this.menuMusicElement.currentTime = 0;
        }
        this.gameMusicElements.forEach(el => {
            if (!el.paused) {
                el.pause();
                el.currentTime = 0;
            }
        });
        this.currentTrack = null;
    }

    /**
     * Reduce el volumen de la música del juego.
     */
    duckGameMusic() {
        if (!this.gameMusicGain || !this.audioContext) return;
        const targetVolume = this.baseGameVolume * 0.1 * settings.masterVolume;
        this.fadeVolume(this.gameMusicGain, targetVolume, 200);
    }

    /**
     * Restaura el volumen de la música del juego.
     */
    restoreGameMusic() {
        if (!this.gameMusicGain || !this.audioContext) return;
        const targetVolume = this.baseGameVolume * settings.masterVolume;
        this.fadeVolume(this.gameMusicGain, targetVolume, 500);
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