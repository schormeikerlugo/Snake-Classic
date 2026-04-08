/**
 * @file canvas.js
 * @description Gestión del canvas y posiciones de spawn para el multiplayer.
 */

import * as C from '../../../config/constants.js';
import gameState, { GRID_COLS, GRID_ROWS } from './gameState.js';

let resizeHandler = null;

/**
 * Redimensionar canvas manteniendo el grid lógico fijo.
 * cellSize se adapta a la pantalla, pero cols/rows son siempre iguales.
 */
export function resizeCanvas() {
    const container = C.canvas.parentElement;
    if (!container) return;

    const availableWidth = container.clientWidth || window.innerWidth * 0.9;
    const availableHeight = container.clientHeight || window.innerHeight * 0.7;

    const maxSide = Math.min(availableWidth, availableHeight) - 20;

    // cellSize se adapta para que el grid fijo quepa en la pantalla
    gameState.cellSize = Math.max(8, Math.floor(maxSide / GRID_COLS));
    gameState.cols = GRID_COLS;
    gameState.rows = GRID_ROWS;

    const finalSize = gameState.cellSize * GRID_COLS;

    C.canvas.width = finalSize;
    C.canvas.height = finalSize;
    C.fxCanvas.width = finalSize;
    C.fxCanvas.height = finalSize;
}

/**
 * Registrar listener de resize (idempotente)
 */
export function setupResizeListener() {
    if (resizeHandler) return;

    resizeHandler = () => {
        resizeCanvas();
        updateSpawnPositions();
    };

    window.addEventListener('resize', resizeHandler);
}

/**
 * Desregistrar listener de resize
 */
export function removeResizeListener() {
    if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
        resizeHandler = null;
    }
}

/**
 * Actualizar posiciones de spawn tras un resize (solo pre-juego)
 */
export function updateSpawnPositions() {
    if (gameState.isRunning) return;

    const spawns = getSpawnPositions();
    Object.values(gameState.players).forEach((player, index) => {
        if (spawns[index]) {
            player.snake = [{ ...spawns[index] }];
            player.prevSnake = [{ ...spawns[index] }];
        }
    });
}

/**
 * Obtener posición de spawn según índice
 */
export function getSpawnPosition(index) {
    const { cols, rows } = gameState;
    const margin = 3;

    const positions = [
        { x: margin, y: Math.floor(rows / 2) },
        { x: cols - margin - 1, y: Math.floor(rows / 2) },
        { x: Math.floor(cols / 2), y: margin },
        { x: Math.floor(cols / 2), y: rows - margin - 1 }
    ];

    return positions[index % positions.length];
}

/**
 * Obtener dirección inicial según índice de spawn
 */
export function getInitialDirection(index) {
    const directions = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 }
    ];

    return directions[index % directions.length];
}

/**
 * Posiciones de spawn iniciales (usadas en initPlayers)
 */
function getSpawnPositions() {
    const { cols, rows } = gameState;
    return [
        { x: 3, y: 3 },
        { x: cols - 4, y: rows - 4 },
        { x: cols - 4, y: 3 },
        { x: 3, y: rows - 4 }
    ];
}

/**
 * Direcciones iniciales para initPlayers
 */
const INITIAL_DIRECTIONS = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: -1, y: 0 },
    { x: 1, y: 0 }
];

/**
 * Inicializar jugadores con posiciones de spawn
 */
export function initPlayers(jugadoresSala) {
    const spawns = getSpawnPositions();
    gameState.players = {};

    jugadoresSala.forEach((jugador, index) => {
        const spawn = spawns[index];
        const dir = INITIAL_DIRECTIONS[index];
        const perfil = jugador.perfiles || {};

        gameState.players[jugador.user_id] = {
            id: jugador.user_id,
            name: perfil.username || `Jugador ${index + 1}`,
            color: jugador.color || (index === 0 ? '#00FFFF' : '#FF00FF'),

            snake: [{ x: spawn.x, y: spawn.y }],
            prevSnake: [{ x: spawn.x, y: spawn.y }],
            dir: { ...dir },
            nextDir: { ...dir },
            cellSize: gameState.cellSize,

            score: 0,
            isAlive: true,

            snakeHeadColor: jugador.color || (index === 0 ? '#00FFFF' : '#FF00FF'),
            snakeBodyColor: jugador.color || (index === 0 ? '#00AAAA' : '#AA00AA'),
            expression: 'normal',
            activePowerUp: { type: null },
            headBlinkActive: false,
            isImmune: false,
            focusTarget: null
        };
    });
}
