import { settings } from './settings.js';

/**
 * Gestiona la reproducción de la música de fondo.
 */
class AudioManager {
    constructor() {
        this.menuMusic = new Audio('assets/audio/menu/menu.mp3');
        this.gameMusic = new Audio('assets/audio/game/pista-01.mp3');
        this.currentTrack = null;

        this.baseMenuVolume = 0.5;
        this.baseGameVolume = 0.5;

        this.menuMusic.loop = true;
        this.gameMusic.loop = true;
        this.setMasterVolume(settings.masterVolume);
    }

    setMasterVolume(volume) {
        settings.masterVolume = volume;
        this.menuMusic.volume = this.baseMenuVolume * volume;
        this.gameMusic.volume = this.baseGameVolume * volume;
    }

    /**
     * Reproduce una pista de audio, deteniendo cualquier otra que esté sonando.
     * @param {HTMLAudioElement} track - La pista de audio a reproducir.
     * @private
     */
    _play(track) {
        if (this.currentTrack === track) return;
        if (!settings.sound) return;
        
        this.stopAllMusic();
        track.play().catch(e => console.warn("La reproducción de audio fue impedida por el navegador. Se requiere interacción del usuario."));
        this.currentTrack = track;
    }

    /**
     * Inicia la música del menú.
     */
    playMenuMusic() {
        this._play(this.menuMusic);
    }

    /**
     * Inicia la música del juego.
     */
    playGameMusic() {
        this._play(this.gameMusic);
    }

    /**
     * Detiene toda la música y reinicia su tiempo.
     */
    stopAllMusic() {
        this.menuMusic.pause();
        this.menuMusic.currentTime = 0;
        this.gameMusic.pause();
        this.gameMusic.currentTime = 0;
        this.currentTrack = null;
    }

    /**
     * Reduce el volumen de la música del juego al 10%.
     */
    duckGameMusic() {
        this.gameMusic.volume = (this.baseGameVolume * settings.masterVolume) * 0.1;
    }

    /**
     * Restaura el volumen de la música del juego al 100%.
     */
    restoreGameMusic() {
        this.gameMusic.volume = this.baseGameVolume * settings.masterVolume;
    }

    /**
     * Transiciona suavemente el volumen de una pista de audio.
     * @param {HTMLAudioElement} track - La pista de audio cuyo volumen se va a transicionar.
     * @param {number} targetVolume - El volumen final deseado (0.0 a 1.0).
     * @param {number} duration - La duración de la transición en milisegundos.
     * @returns {Promise<void>} - Una promesa que se resuelve cuando la transición ha terminado.
     */
    fadeVolume(track, targetVolume, duration) {
        const startVolume = track.volume;
        const volumeDiff = targetVolume - startVolume;
        const startTime = performance.now();

        return new Promise(resolve => {
            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                track.volume = startVolume + volumeDiff * progress;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            requestAnimationFrame(animate);
        });
    }

    /**
     * Actualiza el estado de la música (reproduciendo o parada) según la configuración de sonido.
     */
    updateMusicState() {
        if (settings.sound) {
            if (this.currentTrack) {
                this.currentTrack.play().catch(e => console.warn("La reproducción de audio fue impedida por el navegador."));
            }
        } else {
            this.stopAllMusic();
        }
    }
}

export const audioManager = new AudioManager();
