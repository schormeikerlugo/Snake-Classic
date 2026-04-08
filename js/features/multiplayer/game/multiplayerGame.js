/**
 * @file multiplayerGame.js
 * @description Orquestador del juego multiplayer.
 * Coordina los módulos: gameState, canvas, collision, input, renderer, rematch.
 */

import * as U from '../../../utils/utils.js';
import { supabase } from '../../../lib/supabaseClient.js';
import { broadcastEvent, onRoomEvents } from '../rooms.js';
import { audioManager } from '../../../sound/audio.js';
import { sfx } from '../../../sound/sfx.js';
import { haptics } from '../../../utils/haptics.js';

import gameState, { resetGameState } from './gameState.js';
import { resizeCanvas, setupResizeListener, removeResizeListener, initPlayers } from './canvas.js';
import { checkCollision, placeFood } from './collision.js';
import { handleKeydown, setInputCallbacks, setupTouchControls, setupCanvasTouch, removeTouchControls } from './input.js';
import { drawMultiplayer } from './renderer.js';
import { createHUD, updateHUD, destroyHUD } from './hudUI.js';
import { showGameOver, hideGameOver } from './gameOverUI.js';
import { showToast, destroyToasts } from './toastUI.js';
import {
    requestRematch, setRematchCallback,
    handleRematchRequest, handleRematchAccept, handleRematch
} from './rematch.js';
import { leaveRoom } from '../rooms.js';

/**
 * Inicializar el juego multiplayer
 */
export async function initMultiplayerGame(roomInfo, hostFlag, gameMode = 'duelo') {
    resetGameState();

    const { data: { user } } = await supabase.auth.getUser();
    gameState.localPlayerId = user?.id;
    gameState.isHost = hostFlag;
    gameState.gameMode = gameMode;

    // Canvas
    resizeCanvas();
    setupResizeListener();

    // Colores CSS
    gameState.gridColor = U.getCssVar('--grid');
    gameState.foodColor = U.getCssVar('--food');

    // Jugadores y comida
    initPlayers(roomInfo.jugadores_sala);
    placeFood();

    // HUD HTML
    createHUD();

    // Input
    setInputCallbacks({
        onEscape: stopMultiplayerGame,
        onSpace: requestRematch
    });
    document.addEventListener('keydown', handleKeydown);
    setupTouchControls();
    setupCanvasTouch(document.getElementById('game'));

    // Revancha: cuando todos aceptan, reiniciar loop + timer
    setRematchCallback(() => {
        startGameLoop();
        if (gameState.gameMode === 'puntos') {
            startTimer();
        }
    });

    // Eventos de red
    onRoomEvents({
        onGameState: handleRemoteGameState,
        onPlayerMove: handleRemotePlayerMove,
        onTimerUpdate: handleTimerUpdate,
        onGameOver: handleRemoteGameOver,
        onGameRematch: handleRematch,
        onRematchRequest: handleRematchRequest,
        onRematchAccept: handleRematchAccept,
        onPlayerLeft: handlePlayerLeftDuringGame,
        onRoomClosed: handleRoomClosedDuringGame
    });

    // Vistas
    document.getElementById('menu-view')?.classList.add('hidden');
    document.getElementById('game-view')?.classList.remove('hidden');
}

/**
 * Iniciar el juego (tras countdown)
 */
export function startMultiplayerGame() {
    if (gameState.isRunning) return;

    audioManager.playGameMusic();

    if (gameState.gameMode === 'puntos') {
        gameState.timer = 120;
        startTimer();
    }

    startGameLoop();
}

/**
 * Arrancar el game loop
 */
function startGameLoop() {
    gameState.isRunning = true;
    gameState.lastTickTime = performance.now();
    gameState.gameLoopId = requestAnimationFrame(gameLoop);
}

/**
 * Iniciar timer para modo puntos
 */
function startTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }

    gameState.timerInterval = setInterval(() => {
        if (!gameState.isRunning) {
            clearInterval(gameState.timerInterval);
            return;
        }

        gameState.timer--;

        if (gameState.isHost) {
            broadcastEvent('timer_update', { timer: gameState.timer });
        }

        if (gameState.timer <= 0) {
            checkGameEnd();
        }

        if (gameState.timer === 30) {
            sfx.play('bonus');
            showToast('¡30 segundos!');
        }
    }, 1000);
}

/**
 * Game loop (requestAnimationFrame)
 */
function gameLoop(currentTime) {
    if (!gameState.isRunning) return;

    gameState.gameLoopId = requestAnimationFrame(gameLoop);

    if (gameState.isHost) {
        const elapsed = currentTime - gameState.lastTickTime;
        if (elapsed >= gameState.tickMs) {
            gameState.lastTickTime = currentTime;
            tick();
            broadcastEvent('game_state', getSerializableState());
        }
    }

    const alpha = Math.min(1, (currentTime - gameState.lastTickTime) / gameState.tickMs);
    drawMultiplayer(currentTime, alpha);
}

/**
 * Tick del juego — actualiza posiciones (solo host)
 */
function tick() {
    for (const playerId in gameState.players) {
        const player = gameState.players[playerId];
        if (!player.isAlive) continue;

        player.prevSnake = player.snake.map(s => ({ ...s }));
        player.dir = { ...player.nextDir };

        const head = player.snake[0];
        const newHead = {
            x: head.x + player.dir.x,
            y: head.y + player.dir.y
        };

        if (checkCollision(playerId, newHead)) {
            player.isAlive = false;
            player.expression = 'dead';
            if (playerId === gameState.localPlayerId) {
                sfx.play('gameOver');
                haptics.die();
            }
            continue;
        }

        player.snake.unshift(newHead);

        if (gameState.food && newHead.x === gameState.food.x && newHead.y === gameState.food.y) {
            player.score++;
            if (playerId === gameState.localPlayerId) {
                sfx.play('eat');
                haptics.eat();
            }
            placeFood();
        } else {
            player.snake.pop();
        }
    }

    checkGameEnd();
}

/**
 * Verificar fin del juego
 */
function checkGameEnd() {
    const totalPlayers = Object.values(gameState.players).length;
    const alive = Object.values(gameState.players).filter(p => p.isAlive);

    if (gameState.gameMode === 'duelo') {
        if (totalPlayers >= 2 && alive.length <= 1) {
            endGame(alive[0]);
        }
    } else if (gameState.gameMode === 'puntos') {
        if (gameState.timer <= 0 || alive.length === 0) {
            const sorted = Object.values(gameState.players)
                .sort((a, b) => b.score - a.score);
            endGame(sorted[0]);
        }
    }
}

/**
 * Finalizar el juego
 */
function endGame(winner) {
    gameState.isRunning = false;
    haptics.gameOver();

    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }

    gameState.isGameOver = true;

    // Notificar al cliente que el juego terminó
    if (gameState.isHost) {
        broadcastEvent('game_over', {
            winnerId: winner?.id || null,
            winnerName: winner?.name || null,
            winnerScore: winner?.score || 0,
            players: getSerializableState().players
        });
    }

    setTimeout(() => {
        showGameOver(winner, {
            onRematch: requestRematch,
            onExit: stopMultiplayerGame
        });
    }, 100);
}

/**
 * Obtener estado serializable para enviar por red
 */
function getSerializableState() {
    const state = { players: {}, food: gameState.food };

    for (const [id, player] of Object.entries(gameState.players)) {
        state.players[id] = {
            snake: player.snake,
            dir: player.dir,
            score: player.score,
            isAlive: player.isAlive
        };
    }

    return state;
}

// --- Network handlers ---

function handleRemoteGameState(state) {
    if (gameState.isHost) return;

    for (const [id, playerState] of Object.entries(state.players)) {
        if (gameState.players[id]) {
            gameState.players[id].prevSnake = gameState.players[id].snake.map(s => ({ ...s }));
            gameState.players[id].snake = playerState.snake;
            gameState.players[id].dir = playerState.dir;
            gameState.players[id].score = playerState.score;
            gameState.players[id].isAlive = playerState.isAlive;

            if (!playerState.isAlive) {
                gameState.players[id].expression = 'dead';
            }
        }
    }

    gameState.food = state.food;
    gameState.lastTickTime = performance.now();
}

function handleRemotePlayerMove(payload) {
    if (!payload?.player_id || !payload?.dir) return;

    const player = gameState.players[payload.player_id];
    if (player && player.isAlive) {
        player.nextDir = { ...payload.dir };
    }
}

function handleTimerUpdate(payload) {
    if (gameState.isHost) return;
    if (typeof payload?.timer === 'number') {
        gameState.timer = payload.timer;
    }
}

/**
 * Un jugador salió durante el juego
 */
function handlePlayerLeftDuringGame(payload) {
    const userId = payload?.user_id || payload?.new?.user_id;
    if (!userId) return;

    const player = gameState.players[userId];
    if (player) {
        player.isAlive = false;
        player.expression = 'dead';
        showToast(`${player.name} abandonó`);
    }

    // Si quedan menos de 2 jugadores vivos, terminar
    const alive = Object.values(gameState.players).filter(p => p.isAlive);
    if (alive.length <= 1 && gameState.isRunning) {
        endGame(alive[0] || null);
    }
}

/**
 * El host cerró la sala durante el juego
 */
function handleRoomClosedDuringGame() {
    gameState.isRunning = false;

    if (gameState.gameLoopId) {
        cancelAnimationFrame(gameState.gameLoopId);
        gameState.gameLoopId = null;
    }
    if (gameState.gameOverAnimationId) {
        cancelAnimationFrame(gameState.gameOverAnimationId);
        gameState.gameOverAnimationId = null;
    }
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }

    document.removeEventListener('keydown', handleKeydown);
    removeTouchControls();
    removeResizeListener();
    destroyHUD();
    hideGameOver();

    document.getElementById('game-view')?.classList.add('hidden');
    document.getElementById('menu-view')?.classList.remove('hidden');

    audioManager.playMenuMusic();
    showToast('El host cerró la sala');
}

function handleRemoteGameOver(payload) {
    if (gameState.isHost) return; // Host ya maneja esto localmente

    // Sincronizar estado final de jugadores
    if (payload?.players) {
        for (const [id, playerState] of Object.entries(payload.players)) {
            if (gameState.players[id]) {
                gameState.players[id].snake = playerState.snake;
                gameState.players[id].score = playerState.score;
                gameState.players[id].isAlive = playerState.isAlive;
                if (!playerState.isAlive) {
                    gameState.players[id].expression = 'dead';
                }
            }
        }
    }

    // Encontrar al ganador en el estado local
    const winner = payload?.winnerId ? gameState.players[payload.winnerId] : null;

    endGame(winner);
}

/**
 * Detener el juego y volver al menú
 */
export function stopMultiplayerGame() {
    gameState.isRunning = false;

    if (gameState.gameLoopId) {
        cancelAnimationFrame(gameState.gameLoopId);
        gameState.gameLoopId = null;
    }

    if (gameState.gameOverAnimationId) {
        cancelAnimationFrame(gameState.gameOverAnimationId);
        gameState.gameOverAnimationId = null;
    }

    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }

    document.removeEventListener('keydown', handleKeydown);
    removeTouchControls();
    removeResizeListener();
    destroyHUD();
    hideGameOver();
    destroyToasts();

    // Salir de la sala y notificar al otro jugador
    leaveRoom();

    document.getElementById('game-view')?.classList.add('hidden');
    document.getElementById('menu-view')?.classList.remove('hidden');

    audioManager.playMenuMusic();
}

/**
 * Exportar estado para debugging
 */
export function getMultiplayerGameState() {
    return gameState;
}
