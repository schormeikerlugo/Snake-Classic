import { settings } from './settings.js';

/**
 * Gestiona la reproducción de la música de fondo.
 */
class AudioManager {
    constructor() {
        this.menuMusic = new Audio('assets/audio/menu/menu.mp3');
        this.gameMusic = new Audio('assets/audio/game/pista-01.mp3');
        this.currentTrack = null;

        this.menuMusic.loop = true;
        this.gameMusic.loop = true;
        this.menuMusic.volume = 0.5;
        this.gameMusic.volume = 0.5;
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
