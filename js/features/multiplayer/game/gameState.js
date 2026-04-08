/**
 * @file gameState.js
 * @description Estado compartido del juego multiplayer.
 * Fuente única de verdad para todos los módulos del multiplayer.
 */

// Grid lógico fijo — igual para todos los jugadores independiente de pantalla
const GRID_COLS = 25;
const GRID_ROWS = 25;

export { GRID_COLS, GRID_ROWS };

const gameState = {
    isRunning: false,
    isHost: false,
    localPlayerId: null,
    gameLoopId: null,
    lastTickTime: 0,
    tickMs: 120,
    cols: GRID_COLS,
    rows: GRID_ROWS,
    cellSize: 24,
    players: {},
    food: { x: 0, y: 0 },
    gridColor: '',
    foodColor: '#FF0000',
    // Modo de juego
    gameMode: 'duelo', // 'duelo' | 'puntos'
    timer: 120,
    timerInterval: null,
    // Seguimiento de victorias
    matchHistory: [],
    victoryCount: {},
    currentRound: 1,
    gameOverAnimationId: null,
    // Game over
    isGameOver: false,
    // Sistema de revancha
    rematchPending: false,
    rematchRequester: null,
    rematchAccepted: {}
};

/**
 * Resetear gameState a valores iniciales para una nueva partida
 */
export function resetGameState() {
    gameState.isRunning = false;
    gameState.gameLoopId = null;
    gameState.lastTickTime = 0;
    gameState.cols = GRID_COLS;
    gameState.rows = GRID_ROWS;
    gameState.players = {};
    gameState.food = { x: 0, y: 0 };
    gameState.timer = 120;
    gameState.timerInterval = null;
    gameState.matchHistory = [];
    gameState.victoryCount = {};
    gameState.currentRound = 1;
    gameState.gameOverAnimationId = null;
    gameState.isGameOver = false;
    gameState.rematchPending = false;
    gameState.rematchRequester = null;
    gameState.rematchAccepted = {};
}

export default gameState;
