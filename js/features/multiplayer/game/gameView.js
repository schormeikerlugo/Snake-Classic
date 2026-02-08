/**
 * @file gameView.js
 * @description Vista del juego multiplayer
 * Gestiona la transición del lobby al juego usando el canvas principal
 */

import { supabase } from '../../../lib/supabaseClient.js';
import { initMultiplayerGame, startMultiplayerGame, stopMultiplayerGame } from './multiplayerGame.js';
import { getCurrentRoom } from '../rooms.js';
import { getRoomInfo } from '../roomState.js';
import { hideMultiplayer } from '../multiplayerUI.js';

let countdownInterval = null;

/**
 * Iniciar el juego desde el lobby
 */
export async function startGameFromLobby() {
    // Obtener info actualizada de la sala
    const room = await getRoomInfo();
    if (!room) {
        console.error('No se pudo obtener info de la sala');
        return;
    }

    // Obtener info del usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    const isHost = user?.id === room.host_id;

    // Ocultar UI del multiplayer
    hideMultiplayer();

    // Inicializar juego multiplayer (usa canvas principal)
    await initMultiplayerGame(room, isHost);

    // Iniciar countdown
    showCountdown(3, () => {
        startMultiplayerGame();
    });
}

/**
 * Mostrar countdown antes de iniciar
 */
function showCountdown(seconds, onComplete) {
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');

    let remaining = seconds;

    const drawCountdownNumber = () => {
        // Dibujar número de countdown
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#00FFFF';
        ctx.font = 'bold 96px "Pixelify Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(remaining.toString(), canvas.width / 2, canvas.height / 2);

        // Texto inferior
        ctx.font = '24px "Pixelify Sans"';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('¡Prepárate!', canvas.width / 2, canvas.height / 2 + 70);
    };

    drawCountdownNumber();

    countdownInterval = setInterval(() => {
        remaining--;

        if (remaining <= 0) {
            clearInterval(countdownInterval);
            countdownInterval = null;
            onComplete();
        } else {
            drawCountdownNumber();
        }
    }, 1000);
}

/**
 * Detener countdown si está activo
 */
export function stopCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

/**
 * Salir del juego y volver al menú
 */
export function leaveGame() {
    stopCountdown();
    stopMultiplayerGame();
}
