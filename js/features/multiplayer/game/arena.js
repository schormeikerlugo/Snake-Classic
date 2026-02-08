/**
 * @file arena.js
 * @description Arena del juego multiplayer
 * Maneja el estado del tablero, serpientes y colisiones
 */

import * as C from '../../../config/constants.js';

// Direcciones
const DIRECTIONS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
};

// Opuestos
const OPPOSITES = {
    up: 'down',
    down: 'up',
    left: 'right',
    right: 'left'
};

export class MultiplayerArena {
    constructor(roomInfo) {
        this.roomInfo = roomInfo;
        this.mode = roomInfo.mode; // 'duel' o 'points'

        // Dimensiones (arena más pequeña para duelos)
        this.cols = this.mode === 'duel' ? 25 : 30;
        this.rows = this.mode === 'duel' ? 25 : 30;

        // Jugadores
        this.players = this.initPlayers(roomInfo.jugadores_sala);
        this.localPlayerId = null;

        // Comida
        this.food = null;

        // Velocidad
        this.tickMs = 100;

        // Estado
        this.gameOver = false;
        this.winner = null;

        // Rondas (para duelos)
        this.currentRound = 1;
        this.maxRounds = 3;
        this.roundWins = {};
    }

    /**
     * Inicializar jugadores con posiciones de spawn
     */
    initPlayers(jugadoresSala) {
        const spawnPositions = [
            { x: 3, y: 3, dir: 'right' },           // Esquina superior izquierda
            { x: this.cols - 4, y: this.rows - 4, dir: 'left' },  // Esquina inferior derecha
            { x: this.cols - 4, y: 3, dir: 'left' },              // Superior derecha
            { x: 3, y: this.rows - 4, dir: 'right' }              // Inferior izquierda
        ];

        const players = {};

        jugadoresSala.forEach((jugador, index) => {
            const spawn = spawnPositions[index];
            const profile = jugador.perfiles || {};

            players[jugador.user_id] = {
                id: jugador.user_id,
                name: profile.username || `Jugador ${index + 1}`,
                color: jugador.color || '#00FFFF',
                snake: [{ x: spawn.x, y: spawn.y }],
                direction: spawn.dir,
                nextDirection: spawn.dir,
                score: 0,
                isAlive: true,
                roundWins: 0
            };
        });

        return players;
    }

    /**
     * Establecer ID del jugador local
     */
    setLocalPlayer(userId) {
        this.localPlayerId = userId;
    }

    /**
     * Reiniciar para nueva ronda
     */
    reset() {
        const spawnPositions = [
            { x: 3, y: 3, dir: 'right' },
            { x: this.cols - 4, y: this.rows - 4, dir: 'left' },
            { x: this.cols - 4, y: 3, dir: 'left' },
            { x: 3, y: this.rows - 4, dir: 'right' }
        ];

        let index = 0;
        for (const playerId in this.players) {
            const spawn = spawnPositions[index];
            const player = this.players[playerId];

            player.snake = [{ x: spawn.x, y: spawn.y }];
            player.direction = spawn.dir;
            player.nextDirection = spawn.dir;
            player.isAlive = true;

            if (this.mode === 'points') {
                player.score = 0;
            }

            index++;
        }

        this.placeFood();
        this.gameOver = false;
        this.winner = null;
    }

    /**
     * Tick del juego - actualiza posiciones y detecta colisiones
     */
    tick() {
        // Mover cada serpiente
        for (const playerId in this.players) {
            const player = this.players[playerId];
            if (!player.isAlive) continue;

            // Actualizar dirección
            player.direction = player.nextDirection;

            // Calcular nueva cabeza
            const dir = DIRECTIONS[player.direction];
            const head = player.snake[0];
            const newHead = {
                x: head.x + dir.x,
                y: head.y + dir.y
            };

            // Detectar colisiones
            const collision = this.checkCollision(playerId, newHead);

            if (collision) {
                player.isAlive = false;
                continue;
            }

            // Mover serpiente
            player.snake.unshift(newHead);

            // ¿Comió comida?
            if (this.food && newHead.x === this.food.x && newHead.y === this.food.y) {
                player.score += 1;
                this.placeFood();
                // No quitar cola (crecer)
            } else {
                player.snake.pop();
            }
        }

        // Verificar fin del juego
        return this.checkGameEnd();
    }

    /**
     * Verificar colisión para un jugador
     */
    checkCollision(playerId, position) {
        // Colisión con paredes
        if (position.x < 0 || position.x >= this.cols ||
            position.y < 0 || position.y >= this.rows) {
            return 'wall';
        }

        // Colisión con serpientes (incluida la propia)
        for (const pid in this.players) {
            const player = this.players[pid];
            if (!player.isAlive) continue;

            for (const segment of player.snake) {
                if (segment.x === position.x && segment.y === position.y) {
                    return pid === playerId ? 'self' : 'player';
                }
            }
        }

        return null;
    }

    /**
     * Verificar fin del juego
     */
    checkGameEnd() {
        const alivePlayers = Object.values(this.players).filter(p => p.isAlive);

        if (this.mode === 'duel') {
            // Duelo: gana el último en pie
            if (alivePlayers.length <= 1) {
                const winner = alivePlayers[0] || null;

                if (winner) {
                    winner.roundWins++;
                }

                return {
                    gameOver: true,
                    winner: winner?.id || null,
                    winnerName: winner?.name || 'Empate',
                    reason: alivePlayers.length === 0 ? 'draw' : 'elimination'
                };
            }
        }

        return { gameOver: false };
    }

    /**
     * Colocar comida en posición aleatoria
     */
    placeFood() {
        let position;
        let attempts = 0;

        do {
            position = {
                x: Math.floor(Math.random() * this.cols),
                y: Math.floor(Math.random() * this.rows)
            };
            attempts++;
        } while (this.isOccupied(position) && attempts < 100);

        this.food = position;
    }

    /**
     * Verificar si una posición está ocupada
     */
    isOccupied(position) {
        for (const player of Object.values(this.players)) {
            for (const segment of player.snake) {
                if (segment.x === position.x && segment.y === position.y) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Establecer dirección del jugador local
     */
    setLocalDirection(direction) {
        const player = this.players[this.localPlayerId];
        if (!player || !player.isAlive) return;

        // No permitir dirección opuesta
        if (OPPOSITES[direction] === player.direction) return;

        player.nextDirection = direction;
    }

    /**
     * Establecer dirección de un jugador remoto
     */
    setRemoteDirection(playerId, direction) {
        const player = this.players[playerId];
        if (!player || !player.isAlive) return;

        player.nextDirection = direction;
    }

    /**
     * Obtener estado serializable
     */
    getState() {
        const playersState = {};

        for (const [id, player] of Object.entries(this.players)) {
            playersState[id] = {
                snake: player.snake,
                direction: player.direction,
                score: player.score,
                isAlive: player.isAlive
            };
        }

        return {
            players: playersState,
            food: this.food,
            currentRound: this.currentRound,
            tickMs: this.tickMs
        };
    }

    /**
     * Establecer estado desde host
     */
    setState(state) {
        for (const [id, playerState] of Object.entries(state.players)) {
            if (this.players[id]) {
                this.players[id].snake = playerState.snake;
                this.players[id].direction = playerState.direction;
                this.players[id].score = playerState.score;
                this.players[id].isAlive = playerState.isAlive;
            }
        }

        this.food = state.food;
        this.currentRound = state.currentRound;
    }
}
