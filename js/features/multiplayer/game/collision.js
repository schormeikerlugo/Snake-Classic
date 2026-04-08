/**
 * @file collision.js
 * @description Detección de colisiones y colocación de comida.
 */

import gameState from './gameState.js';

/**
 * Verificar colisión de una posición.
 * En modo 'puntos' (ghost), las serpientes no colisionan entre sí.
 */
export function checkCollision(playerId, pos) {
    // Paredes
    if (pos.x < 0 || pos.x >= gameState.cols || pos.y < 0 || pos.y >= gameState.rows) {
        return true;
    }

    // Serpientes
    for (const pid in gameState.players) {
        const player = gameState.players[pid];
        if (!player.isAlive) continue;

        // En modo puntos (ghost), ignorar colisión con otras serpientes
        if (gameState.gameMode === 'puntos' && pid !== playerId) {
            continue;
        }

        // Colisión con su propia cola (excepto la punta que se va a mover)
        const snakeToCheck = pid === playerId ? player.snake.slice(0, -1) : player.snake;

        for (const segment of snakeToCheck) {
            if (segment.x === pos.x && segment.y === pos.y) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Verificar si una posición está ocupada por alguna serpiente
 */
export function isOccupied(pos) {
    for (const player of Object.values(gameState.players)) {
        for (const segment of player.snake) {
            if (segment.x === pos.x && segment.y === pos.y) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Colocar comida en una posición aleatoria libre
 */
export function placeFood() {
    let pos;
    let attempts = 0;

    do {
        pos = {
            x: Math.floor(Math.random() * gameState.cols),
            y: Math.floor(Math.random() * gameState.rows)
        };
        attempts++;
    } while (isOccupied(pos) && attempts < 100);

    gameState.food = pos;
}
