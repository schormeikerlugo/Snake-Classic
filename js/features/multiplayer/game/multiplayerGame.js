/**
 * @file multiplayerGame.js
 * @description Juego multijugador que extiende el juego base
 * Usa el mismo canvas, rendering y sistema del juego single player
 */

import * as C from '../../../config/constants.js';
import * as U from '../../../utils/utils.js';
import { draw } from '../../../core/rendering.js';
import { drawSnake } from '../../../core/rendering/snake.js';
import { drawCell } from '../../../core/rendering/cell.js';
import { supabase } from '../../../lib/supabaseClient.js';
import { broadcastEvent, onRoomEvents, getCurrentRoom } from '../rooms.js';
import { updateSnakeColor } from '../../../config/colors.js';
import { audioManager } from '../../../sound/audio.js';
import { sfx } from '../../../sound/sfx.js';

// Estado del juego multiplayer
let gameState = {
    isRunning: false,
    isHost: false,
    localPlayerId: null,
    gameLoopId: null,
    lastTickTime: 0,
    tickMs: 120,
    cols: 0,
    rows: 0,
    cellSize: 24,
    players: {},
    food: { x: 0, y: 0 },
    gridColor: '',
    foodColor: '#FF0000',
    // Fase 4: Competencia por Puntos
    gameMode: 'duelo', // 'duelo' | 'puntos'
    timer: 120, // Segundos (2 minutos)
    timerInterval: null,
    // Seguimiento de victorias
    matchHistory: [], // [{winner: playerId, score: X, mode: 'duelo'}]
    victoryCount: {}, // {playerId: numberOfWins}
    currentRound: 1,
    gameOverAnimationId: null,
    // Sistema de revancha
    rematchPending: false,
    rematchRequester: null,
    rematchAccepted: {}
};

/**
 * Inicializar el juego multijugador
 * @param {Object} roomInfo - Información de la sala
 * @param {boolean} hostFlag - Si es host
 * @param {string} gameMode - Modo de juego: 'duelo' | 'puntos'
 */
export async function initMultiplayerGame(roomInfo, hostFlag, gameMode = 'duelo') {
    // Obtener usuario actual  
    const { data: { user } } = await supabase.auth.getUser();
    gameState.localPlayerId = user?.id;
    gameState.isHost = hostFlag;
    gameState.gameMode = gameMode;

    // Usar el canvas principal del juego
    resizeCanvas();
    setupResizeListener();

    // Obtener colores CSS
    gameState.gridColor = U.getCssVar('--grid');
    gameState.foodColor = U.getCssVar('--food');

    // Inicializar jugadores desde roomInfo
    initPlayers(roomInfo.jugadores_sala);

    // Colocar comida inicial
    placeFood();

    // Configurar controles
    document.addEventListener('keydown', handleKeydown);

    // Registrar callbacks para eventos de red
    onRoomEvents({
        onGameState: handleRemoteGameState,
        onPlayerMove: handleRemotePlayerMove,
        onTimerUpdate: handleTimerUpdate,
        onGameRematch: handleRematch,
        onRematchRequest: handleRematchRequest,
        onRematchAccept: handleRematchAccept
    });

    // Ocultar menú, mostrar vista del juego
    document.getElementById('menu-view')?.classList.add('hidden');
    document.getElementById('game-view')?.classList.remove('hidden');

    const playerCount = Object.keys(gameState.players).length;
    console.log('🎮 Multiplayer inicializado en canvas principal', {
        isHost: gameState.isHost,
        playerCount,
        players: Object.values(gameState.players).map(p => p.name)
    });
}

/**
 * Redimensionar canvas (igual que el juego base)
 */
function resizeCanvas() {
    const isMobile = window.innerWidth <= 768;
    gameState.cellSize = isMobile ? 16 : 24;

    // Obtener el contenedor del canvas
    const container = C.canvas.parentElement;
    if (!container) return;

    // Calcular tamaño disponible
    const availableWidth = container.clientWidth || window.innerWidth * 0.9;
    const availableHeight = container.clientHeight || window.innerHeight * 0.7;

    const size = Math.min(availableWidth, availableHeight) - 20;
    const newSize = Math.floor(size / gameState.cellSize) * gameState.cellSize;

    // Mínimo para evitar canvas muy pequeño
    const finalSize = Math.max(newSize, gameState.cellSize * 10);

    C.canvas.width = finalSize;
    C.canvas.height = finalSize;
    C.fxCanvas.width = finalSize;
    C.fxCanvas.height = finalSize;

    gameState.cols = C.canvas.width / gameState.cellSize;
    gameState.rows = C.canvas.height / gameState.cellSize;

    console.log('📐 Canvas resized:', {
        size: finalSize,
        cols: gameState.cols,
        rows: gameState.rows,
        isMobile
    });
}

// Handler de resize global
let resizeHandler = null;

function setupResizeListener() {
    if (resizeHandler) return;

    resizeHandler = () => {
        resizeCanvas();
        // Re-calcular posiciones de spawn después de resize
        updateSpawnPositions();
    };

    window.addEventListener('resize', resizeHandler);
}

function removeResizeListener() {
    if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
        resizeHandler = null;
    }
}

function updateSpawnPositions() {
    // Actualizar posiciones de spawn basadas en nuevo tamaño
    const spawnPositions = [
        { x: 3, y: 3, dir: { x: 1, y: 0 } },
        { x: gameState.cols - 4, y: gameState.rows - 4, dir: { x: -1, y: 0 } }
    ];

    // Solo actualizar si no ha empezado el juego
    if (!gameState.isRunning) {
        Object.values(gameState.players).forEach((player, index) => {
            if (spawnPositions[index]) {
                const spawn = spawnPositions[index];
                player.snake = [{ x: spawn.x, y: spawn.y }];
                player.prevSnake = [{ x: spawn.x, y: spawn.y }];
            }
        });
    }
}

/**
 * Inicializar jugadores con posiciones de spawn
 */
function initPlayers(jugadoresSala) {
    const spawnPositions = [
        { x: 3, y: 3, dir: { x: 1, y: 0 } },
        { x: gameState.cols - 4, y: gameState.rows - 4, dir: { x: -1, y: 0 } },
        { x: gameState.cols - 4, y: 3, dir: { x: -1, y: 0 } },
        { x: 3, y: gameState.rows - 4, dir: { x: 1, y: 0 } }
    ];

    gameState.players = {};

    jugadoresSala.forEach((jugador, index) => {
        const spawn = spawnPositions[index];
        const perfil = jugador.perfiles || {};

        // Crear objeto game-like para cada jugador (compatible con drawSnake)
        gameState.players[jugador.user_id] = {
            id: jugador.user_id,
            name: perfil.username || `Jugador ${index + 1}`,
            color: jugador.color || (index === 0 ? '#00FFFF' : '#FF00FF'),

            // Propiedades compatibles con el sistema de rendering
            snake: [{ x: spawn.x, y: spawn.y }],
            prevSnake: [{ x: spawn.x, y: spawn.y }],
            dir: { ...spawn.dir },
            nextDir: { ...spawn.dir },
            cellSize: gameState.cellSize,

            // Estado del juego
            score: 0,
            isAlive: true,

            // Propiedades para rendering (compatibilidad con drawSnake)
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

/**
 * Manejar teclas
 */
function handleKeydown(e) {
    // Manejar teclas cuando el juego ha terminado
    if (!gameState.isRunning && gameState.gameOverAnimationId) {
        if (e.key === 'Escape') {
            e.preventDefault();
            stopMultiplayerGame();
            return;
        }
        if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault();
            requestRematch();
            return;
        }
        return;
    }

    if (!gameState.isRunning) return;

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
        case 'Escape':
            stopMultiplayerGame();
            return;
    }

    if (newDir) {
        e.preventDefault();

        // No permitir dirección opuesta
        if (player.dir.x + newDir.x === 0 && player.dir.y + newDir.y === 0) {
            return;
        }

        player.nextDir = { ...newDir };

        // Enviar movimiento a otros
        broadcastEvent('player_move', {
            player_id: gameState.localPlayerId,
            dir: newDir
        });
    }
}

/**
 * Solicitar revancha - Cuando un jugador presiona ESPACIO
 */
function requestRematch() {
    if (gameState.rematchPending) {
        // Ya hay una solicitud pendiente, esto es una aceptación
        acceptRematch();
        return;
    }

    // Marcar como pendiente
    gameState.rematchPending = true;
    gameState.rematchRequester = gameState.localPlayerId;
    gameState.rematchAccepted = {};
    gameState.rematchAccepted[gameState.localPlayerId] = true;

    // Broadcast solicitud
    broadcastEvent('rematch_request', {
        requester_id: gameState.localPlayerId,
        requester_name: gameState.players[gameState.localPlayerId]?.name || 'Jugador'
    });

    // Actualizar UI para mostrar espera
    drawRematchWaiting();

    console.log('📨 Solicitud de revancha enviada');
}

/**
 * Aceptar revancha
 */
function acceptRematch() {
    gameState.rematchAccepted[gameState.localPlayerId] = true;

    // Broadcast aceptación
    broadcastEvent('rematch_accept', {
        player_id: gameState.localPlayerId
    });

    console.log('✅ Revancha aceptada');

    // Verificar si todos aceptaron
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
    }
}

/**
 * Ejecutar revancha - cuando todos aceptaron
 */
function executeRematch() {
    // Detener animación de game over
    if (gameState.gameOverAnimationId) {
        cancelAnimationFrame(gameState.gameOverAnimationId);
        gameState.gameOverAnimationId = null;
    }

    // Reset estado de revancha
    gameState.rematchPending = false;
    gameState.rematchRequester = null;
    gameState.rematchAccepted = {};

    // Incrementar ronda
    gameState.currentRound++;

    // Reiniciar posiciones de jugadores
    updateSpawnPositions();

    for (const playerId in gameState.players) {
        const player = gameState.players[playerId];
        const spawnIndex = Object.keys(gameState.players).indexOf(playerId);
        const spawnPos = getSpawnPosition(spawnIndex);

        player.snake = [spawnPos];
        player.prevSnake = [spawnPos];
        player.dir = getInitialDirection(spawnIndex);
        player.nextDir = null;
        player.score = 0;
        player.isAlive = true;
        player.expression = 'normal';
    }

    // Nueva comida
    placeFood();

    // Reset timer si es modo puntos
    if (gameState.gameMode === 'puntos') {
        gameState.timer = 120;
    }

    // Iniciar juego
    gameState.isRunning = true;
    gameState.lastTickTime = performance.now();
    gameState.gameLoopId = requestAnimationFrame(gameLoop);

    // Reiniciar timer si es necesario
    if (gameState.gameMode === 'puntos') {
        startTimer();
    }

    console.log(`🔄 Revancha iniciada - Ronda ${gameState.currentRound}`);
}

/**
 * Dibujar overlay de espera de revancha
 */
function drawRematchWaiting() {
    const drawWaitingFrame = () => {
        if (!gameState.rematchPending || gameState.isRunning) return;

        C.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        C.ctx.fillRect(0, 0, C.canvas.width, C.canvas.height);

        const centerX = C.canvas.width / 2;
        const centerY = C.canvas.height / 2;

        // Título
        C.ctx.fillStyle = '#00FFFF';
        C.ctx.font = 'bold 32px "Pixelify Sans"';
        C.ctx.textAlign = 'center';
        C.ctx.fillText('¡REVANCHA!', centerX, centerY - 60);

        // Mostrar quién aceptó
        const acceptedCount = Object.keys(gameState.rematchAccepted).length;
        const totalPlayers = Object.keys(gameState.players).length;

        C.ctx.font = '24px "Pixelify Sans"';
        C.ctx.fillStyle = '#FFFFFF';
        C.ctx.fillText(`Jugadores listos: ${acceptedCount}/${totalPlayers}`, centerX, centerY);

        // Lista de jugadores
        let y = centerY + 40;
        C.ctx.font = '18px "Pixelify Sans"';

        for (const [playerId, player] of Object.entries(gameState.players)) {
            const isAccepted = gameState.rematchAccepted[playerId];
            const icon = isAccepted ? '✅' : '⏳';
            C.ctx.fillStyle = player.color;
            C.ctx.fillText(`${icon} ${player.name}`, centerX, y);
            y += 25;
        }

        // Instrucción
        C.ctx.font = '16px "Pixelify Sans"';
        C.ctx.fillStyle = '#AAAAAA';
        C.ctx.fillText('[ESPACIO] para aceptar  •  [ESC] para salir', centerX, centerY + 120);

        gameState.gameOverAnimationId = requestAnimationFrame(drawWaitingFrame);
    };

    drawWaitingFrame();
}

/**
 * Obtener posición de spawn según índice
 */
function getSpawnPosition(index) {
    const cols = gameState.cols;
    const rows = gameState.rows;
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
function getInitialDirection(index) {
    const directions = [
        { x: 1, y: 0 },  // Derecha
        { x: -1, y: 0 }, // Izquierda
        { x: 0, y: 1 },  // Abajo
        { x: 0, y: -1 }  // Arriba
    ];

    return directions[index % directions.length];
}

/**
 * Iniciar el juego
 */
export function startMultiplayerGame() {
    if (gameState.isRunning) return;

    gameState.isRunning = true;
    gameState.lastTickTime = performance.now();

    // Iniciar música del juego (detiene música del menú automáticamente)
    audioManager.playGameMusic();

    // Iniciar timer si es modo puntos
    if (gameState.gameMode === 'puntos') {
        gameState.timer = 120; // Reset a 2 minutos
        startTimer();
    }

    // Iniciar loop
    gameState.gameLoopId = requestAnimationFrame(gameLoop);

    console.log('🚀 Juego multiplayer iniciado', { mode: gameState.gameMode });
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

        // Broadcast tiempo restante a todos
        if (gameState.isHost) {
            broadcastEvent('timer_update', { timer: gameState.timer });
        }

        // Verificar fin del juego
        if (gameState.timer <= 0) {
            checkGameEnd();
        }

        // Alerta sonora cuando quedan 30 segundos
        if (gameState.timer === 30) {
            sfx.play('bonus');
        }
    }, 1000);
}

/**
 * Loop del juego (usa requestAnimationFrame como el juego base)
 */
function gameLoop(currentTime) {
    if (!gameState.isRunning) return;

    gameState.gameLoopId = requestAnimationFrame(gameLoop);

    // Solo el host hace tick
    if (gameState.isHost) {
        const elapsed = currentTime - gameState.lastTickTime;
        if (elapsed >= gameState.tickMs) {
            gameState.lastTickTime = currentTime;
            tick();

            // Enviar estado a clientes
            broadcastEvent('game_state', getSerializableState());
        }
    }

    // Calcular alpha para interpolación (igual que el juego base)
    const alpha = Math.min(1, (currentTime - gameState.lastTickTime) / gameState.tickMs);

    // Dibujar usando el sistema de rendering del juego base
    drawMultiplayer(currentTime, alpha);
}

/**
 * Tick del juego - actualiza posiciones (solo host)
 */
function tick() {
    for (const playerId in gameState.players) {
        const player = gameState.players[playerId];
        if (!player.isAlive) continue;

        // Guardar posición anterior para interpolación
        player.prevSnake = player.snake.map(s => ({ ...s }));

        // Actualizar dirección
        player.dir = { ...player.nextDir };

        // Calcular nueva cabeza
        const head = player.snake[0];
        const newHead = {
            x: head.x + player.dir.x,
            y: head.y + player.dir.y
        };

        // Verificar colisiones
        if (checkCollision(playerId, newHead)) {
            player.isAlive = false;
            player.expression = 'dead';
            continue;
        }

        // Mover serpiente
        player.snake.unshift(newHead);

        // ¿Comió?
        if (gameState.food && newHead.x === gameState.food.x && newHead.y === gameState.food.y) {
            player.score++;
            placeFood();
        } else {
            player.snake.pop();
        }
    }

    // Verificar fin del juego
    checkGameEnd();
}

/**
 * Verificar colisión
 * En modo 'puntos' (ghost mode), las serpientes no colisionan entre sí
 */
function checkCollision(playerId, pos) {
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
 * Verificar fin del juego
 * - Modo 'duelo': Termina cuando queda 1 jugador vivo
 * - Modo 'puntos': Termina cuando timer llega a 0
 */
function checkGameEnd() {
    const totalPlayers = Object.values(gameState.players).length;
    const alive = Object.values(gameState.players).filter(p => p.isAlive);

    // Modo Duelo: termina cuando queda 1 o 0 jugadores vivos
    if (gameState.gameMode === 'duelo') {
        if (totalPlayers >= 2 && alive.length <= 1) {
            endGame(alive[0]);
        }
    }
    // Modo Puntos: termina cuando timer llega a 0 o todos mueren
    else if (gameState.gameMode === 'puntos') {
        if (gameState.timer <= 0 || alive.length === 0) {
            // Determinar ganador por puntuación
            const sorted = Object.values(gameState.players)
                .sort((a, b) => b.score - a.score);
            const winner = sorted[0];
            endGame(winner);
        }
    }
}

/**
 * Finalizar el juego
 */
function endGame(winner) {
    gameState.isRunning = false;

    // Detener timer si está activo
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }

    console.log('🏁 Game Over!', winner ? `Ganador: ${winner.name} (${winner.score} pts)` : 'Empate');

    // Dibujar pantalla de game over
    setTimeout(() => {
        drawGameOver(winner);
    }, 100);
}

/**
 * Colocar comida
 */
function placeFood() {
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

/**
 * Verificar si posición está ocupada
 */
function isOccupied(pos) {
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
 * Dibujar el juego usando el canvas principal
 */
function drawMultiplayer(currentTime, alpha) {
    const isMobile = window.innerWidth <= 768;

    // Limpiar canvas
    C.ctx.clearRect(0, 0, C.canvas.width, C.canvas.height);

    // Dibujar grid (igual que el juego base)
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

    // Dibujar comida usando drawCell del juego base
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

    // Dibujar serpientes usando drawSnake del juego base
    for (const player of Object.values(gameState.players)) {
        if (!player.isAlive && player.snake.length === 0) continue;

        // Crear objeto game-like para drawSnake
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

        // Usar la función drawSnake del juego base
        drawSnake(playerGameObj, alpha, isMobile, currentTime, player.snakeBodyColor, 5);
    }

    // Dibujar HUD
    drawHUD();
}

/**
 * Dibujar HUD con nombres y scores
 */
function drawHUD() {
    const players = Object.values(gameState.players);

    C.ctx.font = 'bold 14px "Pixelify Sans", monospace';
    C.ctx.textAlign = 'left';

    players.forEach((player, index) => {
        const x = 10;
        const y = 20 + index * 22;

        // Fondo semitransparente
        C.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        C.ctx.fillRect(x - 5, y - 15, 120, 20);

        // Nombre y score
        const status = player.isAlive ? '' : ' ☠️';
        C.ctx.fillStyle = player.color;
        C.ctx.fillText(`${player.name.slice(0, 8)}: ${player.score}${status}`, x, y);
    });

    // Timer para modo puntos
    if (gameState.gameMode === 'puntos') {
        const mins = Math.floor(gameState.timer / 60);
        const secs = gameState.timer % 60;
        const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

        // Fondo del timer (centrado arriba)
        const timerX = C.canvas.width / 2;
        const timerY = 25;

        C.ctx.textAlign = 'center';
        C.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        C.ctx.fillRect(timerX - 40, timerY - 18, 80, 28);

        // Color rojo si quedan menos de 30 segundos
        C.ctx.fillStyle = gameState.timer <= 30 ? '#FF4444' : '#FFFFFF';
        C.ctx.font = 'bold 20px "Pixelify Sans", monospace';
        C.ctx.fillText(timeStr, timerX, timerY);
    }
}

/**
 * Dibujar pantalla de Game Over con animación y ranking
 */
function drawGameOver(winner) {
    let animationAlpha = 0;
    let animationFrame = 0;

    // Registrar victoria
    if (winner) {
        gameState.victoryCount[winner.id] = (gameState.victoryCount[winner.id] || 0) + 1;
        gameState.matchHistory.push({
            round: gameState.currentRound,
            winnerId: winner.id,
            winnerName: winner.name,
            score: winner.score,
            mode: gameState.gameMode,
            timestamp: Date.now()
        });
    }

    const drawFrame = () => {
        animationFrame++;
        animationAlpha = Math.min(1, animationAlpha + 0.05);

        // Fondo con fade-in
        C.ctx.fillStyle = `rgba(0, 0, 0, ${0.85 * animationAlpha})`;
        C.ctx.fillRect(0, 0, C.canvas.width, C.canvas.height);

        const centerX = C.canvas.width / 2;
        const centerY = C.canvas.height / 2;

        // Título con efecto de pulso
        const pulse = 1 + Math.sin(animationFrame * 0.1) * 0.05;
        C.ctx.save();
        C.ctx.translate(centerX, centerY - 80);
        C.ctx.scale(pulse, pulse);
        C.ctx.fillStyle = winner ? winner.color : '#FF4444';
        C.ctx.font = 'bold 56px "Pixelify Sans"';
        C.ctx.textAlign = 'center';
        C.ctx.fillText('GAME OVER', 0, 0);
        C.ctx.restore();

        // Ganador con animación
        if (animationAlpha >= 0.5) {
            C.ctx.font = 'bold 32px "Pixelify Sans"';
            C.ctx.fillStyle = winner ? winner.color : '#FFFFFF';
            C.ctx.textAlign = 'center';
            C.ctx.fillText(
                winner ? `¡${winner.name} GANA!` : '¡EMPATE!',
                centerX,
                centerY - 20
            );

            // Mostrar score del ganador
            if (winner) {
                C.ctx.font = '24px "Pixelify Sans"';
                C.ctx.fillStyle = '#FFAA00';
                C.ctx.fillText(`Puntuación: ${winner.score}`, centerX, centerY + 15);
            }
        }

        // Ranking de victorias (si hay historial)
        if (animationAlpha >= 0.7 && gameState.matchHistory.length > 0) {
            drawVictoryRanking(centerX, centerY + 55);
        }

        // Botones de acción
        if (animationAlpha >= 0.9) {
            // Botón Revancha
            C.ctx.font = 'bold 20px "Pixelify Sans"';
            C.ctx.fillStyle = '#00FF88';
            C.ctx.fillText('[ESPACIO] Revancha', centerX, centerY + 130);

            // Botón Salir
            C.ctx.fillStyle = '#AAAAAA';
            C.ctx.font = '16px "Pixelify Sans"';
            C.ctx.fillText('[ESC] Salir al menú', centerX, centerY + 160);
        }

        // Continuar animación si no ha terminado
        if (animationAlpha < 1 || animationFrame < 60) {
            gameState.gameOverAnimationId = requestAnimationFrame(drawFrame);
        } else {
            // Animación terminada, mantener último frame
            gameState.gameOverAnimationId = requestAnimationFrame(drawFrame);
        }
    };

    // Iniciar animación
    drawFrame();
}

/**
 * Dibujar ranking de victorias en pantalla de Game Over
 */
function drawVictoryRanking(centerX, startY) {
    C.ctx.font = 'bold 18px "Pixelify Sans"';
    C.ctx.fillStyle = '#FFD700';
    C.ctx.textAlign = 'center';
    C.ctx.fillText(`--- Ronda ${gameState.currentRound} ---`, centerX, startY);

    // Ordenar jugadores por victorias
    const sortedPlayers = Object.entries(gameState.victoryCount)
        .sort(([, a], [, b]) => b - a);

    let y = startY + 25;
    C.ctx.font = '16px "Pixelify Sans"';

    sortedPlayers.forEach(([playerId, wins], index) => {
        const player = gameState.players[playerId];
        if (!player) return;

        const medal = index === 0 ? ' ' : index === 1 ? '🥈' : '🥉';
        C.ctx.fillStyle = player.color;
        C.ctx.fillText(`${medal} ${player.name}: ${wins} victoria${wins > 1 ? 's' : ''}`, centerX, y);
        y += 22;
    });
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

/**
 * Manejar estado remoto del host
 */
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

/**
 * Manejar movimiento remoto de otro jugador
 */
function handleRemotePlayerMove(payload) {
    if (!payload?.player_id || !payload?.dir) return;

    const player = gameState.players[payload.player_id];
    if (player && player.isAlive) {
        player.nextDir = { ...payload.dir };
    }
}

/**
 * Manejar actualización del timer desde el host
 */
function handleTimerUpdate(payload) {
    if (gameState.isHost) return; // Host tiene su propio timer

    if (typeof payload?.timer === 'number') {
        gameState.timer = payload.timer;
    }
}

/**
 * Manejar revancha iniciada por el host
 */
function handleRematch(payload) {
    if (gameState.isHost) return; // Host ya maneja esto en startRematch()

    console.log('🔄 Revancha recibida del host:', payload);

    // Detener animación de game over si existe
    if (gameState.gameOverAnimationId) {
        cancelAnimationFrame(gameState.gameOverAnimationId);
        gameState.gameOverAnimationId = null;
    }

    // Actualizar ronda
    if (payload?.round) {
        gameState.currentRound = payload.round;
    }

    // Reiniciar jugadores (el host enviará el estado actualizado)
    for (const playerId in gameState.players) {
        const player = gameState.players[playerId];
        player.isAlive = true;
        player.score = 0;
        player.expression = 'normal';
    }

    // Reset timer
    if (gameState.gameMode === 'puntos') {
        gameState.timer = 120;
    }

    // Reiniciar juego
    gameState.isRunning = true;
    gameState.lastTickTime = performance.now();
    gameState.gameLoopId = requestAnimationFrame(gameLoop);
}

/**
 * Manejar solicitud de revancha de otro jugador
 */
function handleRematchRequest(payload) {
    if (!payload) return;

    console.log('📨 Solicitud de revancha recibida de:', payload.requester_name);

    // Marcar como pendiente si no lo estaba
    if (!gameState.rematchPending) {
        gameState.rematchPending = true;
        gameState.rematchRequester = payload.requester_id;
        gameState.rematchAccepted = {};
    }

    // Marcar que el solicitante ya aceptó
    gameState.rematchAccepted[payload.requester_id] = true;

    // Mostrar UI de espera
    drawRematchWaiting();
}

/**
 * Manejar aceptación de revancha de otro jugador
 */
function handleRematchAccept(payload) {
    if (!payload?.player_id || !gameState.rematchPending) return;

    console.log('✅ Revancha aceptada por:', payload.player_id);

    // Marcar jugador como aceptado
    gameState.rematchAccepted[payload.player_id] = true;

    // Verificar si todos aceptaron
    checkAllAccepted();
}

/**
 * Detener el juego
 */
export function stopMultiplayerGame() {
    gameState.isRunning = false;

    if (gameState.gameLoopId) {
        cancelAnimationFrame(gameState.gameLoopId);
        gameState.gameLoopId = null;
    }

    document.removeEventListener('keydown', handleKeydown);
    removeResizeListener();

    // Mostrar menú, ocultar juego
    document.getElementById('game-view')?.classList.add('hidden');
    document.getElementById('menu-view')?.classList.remove('hidden');

    // Volver a música del menú
    audioManager.playMenuMusic();

    console.log('⏹️ Juego multiplayer detenido');
}

/**
 * Exportar estado para debugging
 */
export function getMultiplayerGameState() {
    return gameState;
}
