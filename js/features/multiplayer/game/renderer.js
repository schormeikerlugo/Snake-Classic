/**
 * @file renderer.js
 * @description Rendering del juego multiplayer: grid, serpientes, HUD, game over.
 */

import * as C from '../../../config/constants.js';
import { drawSnake } from '../../../core/rendering/snake.js';
import { drawCell } from '../../../core/rendering/cell.js';
import gameState from './gameState.js';
import { updateHUD } from './hudUI.js';

/**
 * Dibujar un frame completo del juego multiplayer
 */
export function drawMultiplayer(currentTime, alpha) {
    const isMobile = window.innerWidth <= 768;

    // Limpiar canvas
    C.ctx.clearRect(0, 0, C.canvas.width, C.canvas.height);

    // Grid
    drawGrid();

    // Comida
    if (gameState.food.x !== undefined) {
        drawCell(
            { cellSize: gameState.cellSize },
            gameState.food.x,
            gameState.food.y,
            gameState.foodColor,
            isMobile,
            null,
            'normal',
            null,
            false
        );
    }

    // Serpientes
    for (const player of Object.values(gameState.players)) {
        if (!player.isAlive && player.snake.length === 0) continue;

        const playerGameObj = {
            snake: player.snake,
            prevSnake: player.prevSnake,
            cellSize: gameState.cellSize,
            snakeHeadColor: player.snakeHeadColor,
            snakeBodyColor: player.snakeBodyColor,
            dir: player.dir,
            expression: player.expression,
            activePowerUp: player.activePowerUp,
            headBlinkActive: player.headBlinkActive,
            isImmune: player.isImmune,
            focusTarget: player.focusTarget
        };

        drawSnake(playerGameObj, alpha, isMobile, currentTime, player.snakeBodyColor, 5);
    }

    // HUD (actualiza HTML, no canvas)
    updateHUD();
}

/**
 * Dibujar grid
 */
function drawGrid() {
    C.ctx.strokeStyle = gameState.gridColor;
    C.ctx.lineWidth = 1;

    for (let i = 1; i < gameState.cols; i++) {
        C.ctx.beginPath();
        C.ctx.moveTo(i * gameState.cellSize, 0);
        C.ctx.lineTo(i * gameState.cellSize, C.canvas.height);
        C.ctx.stroke();
    }
    for (let i = 1; i < gameState.rows; i++) {
        C.ctx.beginPath();
        C.ctx.moveTo(0, i * gameState.cellSize);
        C.ctx.lineTo(C.canvas.width, i * gameState.cellSize);
        C.ctx.stroke();
    }
}
