import { audioManager } from '../../sound/audio.js';
import { sfx } from '../../sound/sfx.js';
import { settings } from '../../features/settings.js';

export function playSoundWithDucking(soundName) {
    audioManager.fadeVolume(audioManager.gameMusicGain, audioManager.baseGameVolume * settings.masterVolume * 0.3, 150)
        .then(() => {
            sfx.play(soundName);
            // Estimate sound duration, or use a fixed delay
            setTimeout(() => {
                audioManager.fadeVolume(audioManager.gameMusicGain, audioManager.baseGameVolume * settings.masterVolume, 400);
            }, 1000); // Adjusted delay for sound to play out
        });
}
