/**
 * @file haptics.js
 * @description Feedback háptico (vibración) para dispositivos móviles.
 * No-op silencioso en dispositivos sin soporte.
 */

const supported = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

function vibrate(pattern) {
    if (!supported) return;
    try {
        navigator.vibrate(pattern);
    } catch (e) {
        // Silenciar errores en navegadores restrictivos
    }
}

export const haptics = {
    /** Comer comida — pulso corto */
    eat()       { vibrate(30); },
    /** Morir — doble pulso */
    die()       { vibrate([60, 40, 120]); },
    /** Activar power-up — triple pulso ascendente */
    powerUp()   { vibrate([40, 30, 40, 30, 80]); },
    /** Game over — pulso dramático */
    gameOver()  { vibrate([120, 60, 250]); },
    /** Countdown tick */
    countdown() { vibrate(50); },
    /** Colisión con pared u obstáculo */
    hit()       { vibrate([80, 30, 80]); },
};
