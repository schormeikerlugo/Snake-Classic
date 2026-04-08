/**
 * @file input.js
 * @description Manejo de input de teclado para el multiplayer.
 */

import gameState from './gameState.js';
import { broadcastEvent } from '../rooms.js';

/** @type {function|null} Callback para cuando se pulsa Escape */
let onEscapeCallback = null;

/** @type {function|null} Callback para cuando se pulsa Space (revancha) */
let onSpaceCallback = null;

/** @type {Array} Touch listeners registrados para cleanup */
let touchListeners = [];

/** @type {function|null} Canvas touch handler para game over/rematch */
let canvasTouchHandler = null;

/**
 * Registrar callbacks para teclas especiales
 */
export function setInputCallbacks({ onEscape, onSpace }) {
    onEscapeCallback = onEscape || null;
    onSpaceCallback = onSpace || null;
}

/**
 * Handler de teclado — exportado para poder registrar/desregistrar
 */
export function handleKeydown(e) {
    // Teclas cuando el juego ha terminado
    if (!gameState.isRunning && gameState.isGameOver) {
        if (e.key === 'Escape') {
            e.preventDefault();
            onEscapeCallback?.();
            return;
        }
        if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault();
            onSpaceCallback?.();
            return;
        }
        return;
    }

    if (!gameState.isRunning) return;

    if (e.key === 'Escape') {
        onEscapeCallback?.();
        return;
    }

    const player = gameState.players[gameState.localPlayerId];
    if (!player || !player.isAlive) return;

    let newDir = null;

    switch (e.key) {
        case 'ArrowUp': case 'w': case 'W':
            newDir = { x: 0, y: -1 };
            break;
        case 'ArrowDown': case 's': case 'S':
            newDir = { x: 0, y: 1 };
            break;
        case 'ArrowLeft': case 'a': case 'A':
            newDir = { x: -1, y: 0 };
            break;
        case 'ArrowRight': case 'd': case 'D':
            newDir = { x: 1, y: 0 };
            break;
    }

    if (newDir) {
        e.preventDefault();
        applyDirection(newDir);
    }
}

/**
 * Aplicar una dirección al jugador local y broadcastearla
 */
function applyDirection(newDir) {
    const player = gameState.players[gameState.localPlayerId];
    if (!player || !player.isAlive) return;

    // No permitir dirección opuesta
    if (player.dir.x + newDir.x === 0 && player.dir.y + newDir.y === 0) {
        return;
    }

    player.nextDir = { ...newDir };

    broadcastEvent('player_move', {
        player_id: gameState.localPlayerId,
        dir: newDir
    });
}

/**
 * Registrar controles táctiles del D-pad móvil
 */
export function setupTouchControls() {
    removeTouchControls();

    const controls = [
        { id: 'ctrl-up', dir: { x: 0, y: -1 } },
        { id: 'ctrl-down', dir: { x: 0, y: 1 } },
        { id: 'ctrl-left', dir: { x: -1, y: 0 } },
        { id: 'ctrl-right', dir: { x: 1, y: 0 } }
    ];

    for (const { id, dir } of controls) {
        const btn = document.getElementById(id);
        if (!btn) continue;

        const handler = (e) => {
            e.preventDefault();
            if (!gameState.isRunning) return;
            applyDirection(dir);
        };

        btn.addEventListener('touchstart', handler);
        touchListeners.push({ el: btn, handler });
    }
}

/**
 * Registrar touch en el canvas para revancha/game over en móvil
 */
export function setupCanvasTouch(canvas) {
    removeCanvasTouch();

    canvasTouchHandler = (e) => {
        if (!gameState.isRunning && gameState.isGameOver) {
            e.preventDefault();
            onSpaceCallback?.();
        }
    };

    canvas.addEventListener('touchstart', canvasTouchHandler);
}

function removeCanvasTouch() {
    if (canvasTouchHandler) {
        const canvas = document.getElementById('game');
        canvas?.removeEventListener('touchstart', canvasTouchHandler);
        canvasTouchHandler = null;
    }
}

/**
 * Limpiar todos los controles táctiles
 */
export function removeTouchControls() {
    for (const { el, handler } of touchListeners) {
        el.removeEventListener('touchstart', handler);
    }
    touchListeners = [];
    removeCanvasTouch();
}
