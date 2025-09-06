import * as C from './constants.js';
import * as U from './utils.js';
import { settings } from './settings.js';

// Import modularized functions
import { drawCell, draw, drawFx, drawCountdown } from './game/rendering.js';
import {
    placeFood, inSnake, resetGame, updateScore, tick, gameLoop, spawnFx, beep,
    setDirection, handleKeydown, countdown, startGame, togglePause, stop, gameOver, animateGlow
} from './game/gameLogic.js';

/**
 * Clase principal que encapsula toda la lógica y el estado del juego Snake.
 */
export class Game {
    /**
     * Inicializa el estado del juego, las propiedades y los listeners de eventos.
     */
    constructor() {
        // Estado del juego
        this.cellSize = 24; // Tamaño de celda por defecto
        this.cols = 0;
        this.rows = 0;
        this.snake = [];
        this.prevSnake = []; // Store previous snake positions for interpolation
        this.dir = { x: 1, y: 0 };
        this.nextDir = { x: 1, y: 0 };
        this.food = {};
        this.score = 0;
        this.best = Number(localStorage.getItem('snake_best') || 0);
        this.running = false;
        this.paused = false;
        this.tickMs = C.INITIAL_TICK_MS;
        this.turnLocked = false;

        this.gameLoopId = null;
        this.lastTickTime = 0;

        this.effects = [];
        this.lastFxTs = 0;
        this.audioCtx = null;

        this.snakeGlowStrong = false;
        this.snakeGlowTimer = null;
        this.foodSpawnTime = 0;
        this.currentGlowIntensity = 0; // New property for glow animation
        this.isGameOver = false; // New property to track game over state
        this.scannerProgress = 0; // New property for scanner animation

        C.BEST_EL.textContent = this.best;
        this.init();
    }

    /**
     * Ajusta el tamaño del canvas y de la celda para que sea responsive.
     */
    resizeCanvas() {
        const isMobile = window.innerWidth <= 768;
        this.cellSize = isMobile ? 16 : 24;

        const container = C.canvas.parentElement;
        const size = Math.min(container.clientWidth, container.clientHeight) - 20;
        const newSize = Math.floor(size / this.cellSize) * this.cellSize;

        C.canvas.width = newSize;
        C.canvas.height = newSize;
        C.fxCanvas.width = newSize;
        C.fxCanvas.height = newSize;

        this.cols = C.canvas.width / this.cellSize;
        this.rows = C.canvas.height / this.cellSize;
    }

    /**
     * Configura los listeners de eventos iniciales y el estado del juego.
     */
    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        C.START_BTN.addEventListener('click', () => startGame(this)); // Pass game instance
        this.initControls();
        draw(this); // Pass game instance
        requestAnimationFrame(ts => drawFx(this, ts)); // Pass game instance
    }

    /**
     * Configura todos los listeners de eventos para los controles (teclado y móvil).
     */
    initControls() {
        // Teclado
        document.addEventListener('keydown', e => handleKeydown(this, e)); // Pass game instance

        // Móvil (D-pad)
        const upBtn = document.getElementById('ctrl-up');
        const downBtn = document.getElementById('ctrl-down');
        const leftBtn = document.getElementById('ctrl-left');
        const rightBtn = document.getElementById('ctrl-right');

        const handleControlClick = (e, newDir) => {
            e.preventDefault();
            setDirection(this, newDir);
        };

        upBtn.addEventListener('touchstart', (e) => handleControlClick(e, { x: 0, y: -1 }));
        downBtn.addEventListener('touchstart', (e) => handleControlClick(e, { x: 0, y: 1 }));
        leftBtn.addEventListener('touchstart', (e) => handleControlClick(e, { x: -1, y: 0 }));
        rightBtn.addEventListener('touchstart', (e) => handleControlClick(e, { x: 1, y: 0 }));

        // Botón de Pausa
        const pauseBtn = document.getElementById('mobile-pause-btn');
        const handlePauseClick = (e) => {
            e.preventDefault();
            togglePause(this);
        };
        pauseBtn.addEventListener('touchstart', handlePauseClick);

        // Botón de Reiniciar (Móvil)
        const restartBtn = document.getElementById('mobile-restart-btn');
        const handleRestartClick = (e) => {
            e.preventDefault();
            startGame(this);
        };
        restartBtn.addEventListener('touchstart', handleRestartClick);
    }

    // Delegated functions
    placeFood() { return placeFood(this); }
    inSnake(pos) { return inSnake(this, pos); }
    resetGame() { return resetGame(this); }
    updateScore() { return updateScore(this); }
    tick() { return tick(this); }
    gameLoop(currentTime) { return gameLoop(this, currentTime); }
    spawnFx(x, y) { return spawnFx(this, x, y); }
    beep(freq, dur) { return beep(this, freq, dur); }
    setDirection(newDir) { return setDirection(this, newDir); }
    handleKeydown(e) { return handleKeydown(this, e); }
    drawCountdown(number) { return drawCountdown(this, number); }
    countdown(seconds) { return countdown(this, seconds); }
    startGame() { return startGame(this); }
    togglePause() { return togglePause(this); }
    stop() { return stop(this); }
    gameOver(noDraw) { return gameOver(this, noDraw); }
    animateGlow(targetIntensity, duration) { return animateGlow(this, targetIntensity, duration); }
}