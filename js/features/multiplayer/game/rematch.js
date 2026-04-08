/**
 * @file rematch.js
 * @description Sistema de revancha del multiplayer.
 */

import gameState from './gameState.js';
import { broadcastEvent } from '../rooms.js';
import { getSpawnPosition, getInitialDirection } from './canvas.js';
import { placeFood } from './collision.js';
import { showRematchWaiting, updateRematchStatus, hideGameOver } from './gameOverUI.js';

/** @type {function|null} Callback para reiniciar el game loop */
let onRematchStart = null;

/**
 * Registrar callback que se ejecuta cuando la revancha comienza
 */
export function setRematchCallback(callback) {
    onRematchStart = callback;
}

/**
 * Solicitar revancha (jugador presiona ESPACIO)
 */
export function requestRematch() {
    if (gameState.rematchPending) {
        acceptRematch();
        return;
    }

    gameState.rematchPending = true;
    gameState.rematchRequester = gameState.localPlayerId;
    gameState.rematchAccepted = {};
    gameState.rematchAccepted[gameState.localPlayerId] = true;

    broadcastEvent('rematch_request', {
        requester_id: gameState.localPlayerId,
        requester_name: gameState.players[gameState.localPlayerId]?.name || 'Jugador'
    });

    showRematchWaiting();
}

/**
 * Aceptar revancha
 */
function acceptRematch() {
    gameState.rematchAccepted[gameState.localPlayerId] = true;

    broadcastEvent('rematch_accept', {
        player_id: gameState.localPlayerId
    });

    checkAllAccepted();
}

/**
 * Verificar si todos los jugadores aceptaron
 */
function checkAllAccepted() {
    const playerIds = Object.keys(gameState.players);
    const allAccepted = playerIds.every(id => gameState.rematchAccepted[id]);

    if (allAccepted) {
        executeRematch();
    } else {
        updateRematchStatus();
    }
}

/**
 * Ejecutar revancha — reiniciar estado y comenzar nuevo round
 */
function executeRematch() {
    hideGameOver();
    gameState.isGameOver = false;

    gameState.rematchPending = false;
    gameState.rematchRequester = null;
    gameState.rematchAccepted = {};
    gameState.currentRound++;

    // Reiniciar jugadores
    const playerIds = Object.keys(gameState.players);
    playerIds.forEach((playerId, index) => {
        const player = gameState.players[playerId];
        const spawnPos = getSpawnPosition(index);

        player.snake = [spawnPos];
        player.prevSnake = [spawnPos];
        player.dir = getInitialDirection(index);
        player.nextDir = { ...player.dir };
        player.score = 0;
        player.isAlive = true;
        player.expression = 'normal';
    });

    placeFood();

    if (gameState.gameMode === 'puntos') {
        gameState.timer = 120;
    }

    onRematchStart?.();
}

/**
 * Manejar solicitud de revancha de otro jugador
 */
export function handleRematchRequest(payload) {
    if (!payload) return;

    if (!gameState.rematchPending) {
        gameState.rematchPending = true;
        gameState.rematchRequester = payload.requester_id;
        gameState.rematchAccepted = {};
    }

    gameState.rematchAccepted[payload.requester_id] = true;
    showRematchWaiting();
}

/**
 * Manejar aceptación de revancha de otro jugador
 */
export function handleRematchAccept(payload) {
    if (!payload?.player_id || !gameState.rematchPending) return;

    gameState.rematchAccepted[payload.player_id] = true;
    checkAllAccepted();
}

/**
 * Manejar revancha iniciada por el host (lado cliente)
 */
export function handleRematch(payload) {
    if (gameState.isHost) return;

    hideGameOver();
    gameState.isGameOver = false;

    if (payload?.round) {
        gameState.currentRound = payload.round;
    }

    for (const playerId in gameState.players) {
        const player = gameState.players[playerId];
        player.isAlive = true;
        player.score = 0;
        player.expression = 'normal';
    }

    if (gameState.gameMode === 'puntos') {
        gameState.timer = 120;
    }

    onRematchStart?.();
}
