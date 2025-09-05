import * as C from './constants.js';
import * as U from './utils.js';
import { settings } from './settings.js';

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

        C.START_BTN.addEventListener('click', () => this.startGame());
        this.initControls();
        this.draw();
        requestAnimationFrame(ts => this.drawFx(ts));
    }

    /**
     * Configura todos los listeners de eventos para los controles (teclado y móvil).
     */
    initControls() {
        // Teclado
        document.addEventListener('keydown', e => this.handleKeydown(e));

        // Móvil (D-pad)
        const upBtn = document.getElementById('ctrl-up');
        const downBtn = document.getElementById('ctrl-down');
        const leftBtn = document.getElementById('ctrl-left');
        const rightBtn = document.getElementById('ctrl-right');

        const handleControlClick = (e, newDir) => {
            e.preventDefault();
            this.setDirection(newDir);
        };

        upBtn.addEventListener('touchstart', (e) => handleControlClick(e, { x: 0, y: -1 }));
        downBtn.addEventListener('touchstart', (e) => handleControlClick(e, { x: 0, y: 1 }));
        leftBtn.addEventListener('touchstart', (e) => handleControlClick(e, { x: -1, y: 0 }));
        rightBtn.addEventListener('touchstart', (e) => handleControlClick(e, { x: 1, y: 0 }));

        // Botón de Pausa
        const pauseBtn = document.getElementById('mobile-pause-btn');
        const handlePauseClick = (e) => {
            e.preventDefault();
            this.togglePause();
        };
        pauseBtn.addEventListener('touchstart', handlePauseClick);
    }

    placeFood() {
        let tries = 0;
        while (true) {
            const c = { x: U.randInt(0, this.cols - 1), y: U.randInt(0, this.rows - 1) };
            if (!this.inSnake(c)) {
                this.food = c;
                return;
            }
            if (++tries > 2000) {
                this.gameOver(true);
                return;
            }
        }
    }

    inSnake(pos) {
        return this.snake.some(seg => U.posEq(seg, pos));
    }

    resetGame() {
        this.resizeCanvas();
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        const cx = Math.floor(this.cols / 2);
        const cy = Math.floor(this.rows / 2);
        this.snake = [{ x: cx, y: cy }];
        this.dir = { x: 1, y: 0 };
        this.nextDir = { ...this.dir };
        this.placeFood();
        this.score = 0;
        this.tickMs = C.INITIAL_TICK_MS;
        this.running = false;
        this.paused = false;
        this.updateScore();
        C.PAUSED_OVERLAY.classList.remove('show');
        this.draw();
    }

    updateScore() {
        C.SCORE_EL.textContent = this.score;
        if (this.score > this.best) {
            this.best = this.score;
            localStorage.setItem('snake_best', this.best);
            C.BEST_EL.textContent = this.best;
        }
    }

    drawCell(x, y, color) {
        const px = x * this.cellSize;
        const py = y * this.cellSize;
        C.ctx.fillStyle = color;
        C.ctx.fillRect(px, py, this.cellSize, this.cellSize);
    }

    draw() {
        C.ctx.clearRect(0, 0, C.canvas.width, C.canvas.height);

        C.ctx.strokeStyle = U.getCssVar('--grid');
        C.ctx.lineWidth = 1;
        for (let i = 1; i < this.cols; i++) {
            C.ctx.beginPath();
            C.ctx.moveTo(i * this.cellSize, 0);
            C.ctx.lineTo(i * this.cellSize, C.canvas.height);
            C.ctx.stroke();
        }
        for (let i = 1; i < this.rows; i++) {
            C.ctx.beginPath();
            C.ctx.moveTo(0, i * this.cellSize);
            C.ctx.lineTo(C.canvas.width, i * this.cellSize);
            C.ctx.stroke();
        }

        if (this.food.x === undefined) return;
        this.drawCell(this.food.x, this.food.y, U.getCssVar('--food'));
        this.snake.forEach((seg, i) => {
            this.drawCell(seg.x, seg.y, i === 0 ? U.getCssVar('--snake-head') : U.getCssVar('--snake'));
        });
    }

    tick() {
        this.dir = this.nextDir;
        const head = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y };

        if (head.x < 0 || head.y < 0 || head.x >= this.cols || head.y >= this.rows || this.inSnake(head)) {
            this.gameOver();
            return;
        }

        this.snake.unshift(head);

        if (U.posEq(head, this.food)) {
            this.score++;
            this.updateScore();
            this.placeFood();
            this.spawnFx(head.x, head.y);
            this.beep(660);
            if (this.tickMs > C.MIN_TICK) this.tickMs -= C.SPEED_STEP;
        } else {
            this.snake.pop();
        }

        this.draw();
        this.turnLocked = false;
    }

    gameLoop(currentTime) {
        this.gameLoopId = requestAnimationFrame(ts => this.gameLoop(ts));
        if (this.paused || !this.running) return;

        const timeSinceLastTick = currentTime - this.lastTickTime;
        if (timeSinceLastTick > this.tickMs) {
            this.lastTickTime = currentTime;
            this.tick();
        }
    }

    spawnFx(x, y) {
        if (!settings.sound) return;
        this.effects.push({ x: x * this.cellSize + this.cellSize / 2, y: y * this.cellSize + this.cellSize / 2, r: 0, alpha: 1 });
    }

    drawFx(ts) {
        C.fxCtx.clearRect(0, 0, C.fxCanvas.width, C.fxCanvas.height);
        const dt = (ts - this.lastFxTs) / 1000;
        this.lastFxTs = ts;
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const fx = this.effects[i];
            fx.r += 60 * dt;
            fx.alpha -= 1.5 * dt;
            if (fx.alpha <= 0) {
                this.effects.splice(i, 1);
                continue;
            }
            C.fxCtx.beginPath();
            C.fxCtx.arc(fx.x, fx.y, fx.r, 0, Math.PI * 2);
            C.fxCtx.strokeStyle = `rgba(255,255,255,${fx.alpha})`;
            C.fxCtx.stroke();
        }
        requestAnimationFrame(ts => this.drawFx(ts));
    }

    beep(freq = 440, dur = 0.05) {
        if (!settings.sound) return;
        if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.value = 0.05;
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + dur);
    }

    setDirection(newDir) {
        if (!this.running || this.turnLocked) return;
        
        const isOpposite = (d1, d2) => d1.x === -d2.x || d1.y === -d2.y;
        if (isOpposite(this.dir, newDir)) return;

        this.nextDir = newDir;
        this.turnLocked = true;
    }

    handleKeydown(e) {
        if (e.code === 'Space') {
            this.togglePause();
            return;
        }

        let newDir;
        if (e.code === 'ArrowUp' || e.code === 'KeyW') newDir = { x: 0, y: -1 };
        if (e.code === 'ArrowDown' || e.code === 'KeyS') newDir = { x: 0, y: 1 };
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') newDir = { x: -1, y: 0 };
        if (e.code === 'ArrowRight' || e.code === 'KeyD') newDir = { x: 1, y: 0 };
        
        if (newDir) this.setDirection(newDir);
    }

    drawCountdown(number) {
        this.draw();
        C.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        C.ctx.fillRect(0, 0, C.canvas.width, C.canvas.height);
        C.ctx.fillStyle = '#fff';
        C.ctx.font = 'bold 96px sans-serif';
        C.ctx.textAlign = 'center';
        C.ctx.textBaseline = 'middle';
        C.ctx.fillText(number, C.canvas.width / 2, C.canvas.height / 2);
    }

    countdown(seconds) {
        if (seconds > 0) {
            this.drawCountdown(seconds);
            this.beep(440, 0.05);
            setTimeout(() => this.countdown(seconds - 1), 1000);
        } else {
            this.draw();
            this.running = true;
            this.gameLoop(0);
            this.beep(880, 0.05);
        }
    }

    startGame() {
        this.resetGame();
        this.countdown(3);
    }

    togglePause() {
        if (!this.running) return;
        this.paused = !this.paused;
        C.PAUSED_OVERLAY.classList.toggle('show', this.paused);
    }

    stop() {
        this.running = false;
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
    }

    gameOver(noDraw) {
        this.beep(220, 0.1);
        this.running = false;
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        if (!noDraw) {
            C.ctx.fillStyle = 'rgba(0,0,0,0.5)';
            C.ctx.fillRect(0, 0, C.canvas.width, C.canvas.height);
            C.ctx.fillStyle = '#fff';
            C.ctx.font = '28px sans-serif';
            C.ctx.textAlign = 'center';
            C.ctx.fillText('GAME OVER', C.canvas.width / 2, C.canvas.height / 2);
        }
    }
}
