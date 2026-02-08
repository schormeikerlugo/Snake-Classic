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
    foodColor: '#FF0000'
};

/**
 * Inicializar el juego multijugador
 * Usa el canvas principal del juego
 */
export async function initMultiplayerGame(roomInfo, hostFlag) {
    // Obtener usuario actual  
    const { data: { user } } = await supabase.auth.getUser();
    gameState.localPlayerId = user?.id;
    gameState.isHost = hostFlag;

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
        onPlayerMove: handleRemotePlayerMove
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
 * Iniciar el juego
 */
export function startMultiplayerGame() {
    if (gameState.isRunning) return;

    gameState.isRunning = true;
    gameState.lastTickTime = performance.now();

    // Iniciar música del juego (detiene música del menú automáticamente)
    audioManager.playGameMusic();

    // Iniciar loop
    gameState.gameLoopId = requestAnimationFrame(gameLoop);

    console.log('🚀 Juego multiplayer iniciado');
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
 */
function checkGameEnd() {
    const totalPlayers = Object.values(gameState.players).length;
    const alive = Object.values(gameState.players).filter(p => p.isAlive);

    // Solo terminar si había al menos 2 jugadores y queda 1 o 0
    if (totalPlayers >= 2 && alive.length <= 1) {
        gameState.isRunning = false;
        const winner = alive[0];

        console.log('🏁 Game Over!', winner ? `Ganador: ${winner.name}` : 'Empate');

        // Dibujar pantalla de game over
        setTimeout(() => {
            drawGameOver(winner);
        }, 100);
    }
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
}

/**
 * Dibujar pantalla de Game Over
 */
function drawGameOver(winner) {
    C.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    C.ctx.fillRect(0, 0, C.canvas.width, C.canvas.height);

    C.ctx.fillStyle = '#FFFFFF';
    C.ctx.font = 'bold 48px "Pixelify Sans"';
    C.ctx.textAlign = 'center';
    C.ctx.fillText('GAME OVER', C.canvas.width / 2, C.canvas.height / 2 - 30);

    C.ctx.font = 'bold 24px "Pixelify Sans"';
    C.ctx.fillStyle = winner ? winner.color : '#FFFFFF';
    C.ctx.fillText(
        winner ? `¡${winner.name} gana!` : '¡Empate!',
        C.canvas.width / 2,
        C.canvas.height / 2 + 20
    );

    C.ctx.font = '16px "Pixelify Sans"';
    C.ctx.fillStyle = '#AAAAAA';
    C.ctx.fillText('Presiona ESC para salir', C.canvas.width / 2, C.canvas.height / 2 + 60);
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
