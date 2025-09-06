import * as C from '../constants.js';
import * as U from '../utils.js';
import { settings } from '../settings.js';
import { draw, drawFx, drawCountdown } from './rendering.js'; // Import drawing functions

export function placeFood(game) {
    let tries = 0;
    while (true) {
        const c = { x: U.randInt(0, game.cols - 1), y: U.randInt(0, game.rows - 1) };
        if (!game.inSnake(c)) {
            game.food = c;
            game.foodSpawnTime = Date.now();
            return;
        }
        if (++tries > 2000) {
            game.gameOver(true);
            return;
        }
    }
}

export function inSnake(game, pos) {
    return game.snake.some(seg => U.posEq(seg, pos));
}

export function resetGame(game) {
    game.resizeCanvas();
    if (game.gameLoopId) {
        cancelAnimationFrame(game.gameLoopId);
        game.gameLoopId = null;
    }
    const cx = Math.floor(game.cols / 2);
    const cy = Math.floor(game.rows / 2);
    game.snake = [{ x: cx, y: cy }];
    game.dir = { x: 1, y: 0 };
    game.nextDir = { ...game.dir };
    placeFood(game);
    game.score = 0;
    game.tickMs = C.INITIAL_TICK_MS;
    game.running = false;
    game.paused = false;
    game.isGameOver = false; // Reset game over flag
    game.scannerProgress = 0; // Reset scanner progress
    game.updateScore();
    C.PAUSED_OVERLAY.classList.remove('show');
    draw(game);
}

export function updateScore(game) {
    C.SCORE_EL.textContent = game.score;
    if (game.score > game.best) {
        game.best = game.score;
        localStorage.setItem('snake_best', game.best);
        C.BEST_EL.textContent = game.best;
    }
}

export function tick(game) {
    game.prevSnake = [...game.snake]; // Store current snake position for interpolation
    game.dir = game.nextDir;
    const head = { x: game.snake[0].x + game.dir.x, y: game.snake[0].y + game.dir.y };

    if (head.x < 0 || head.y < 0 || head.x >= game.cols || head.y >= game.rows || game.inSnake(head)) {
        game.gameOver();
        return;
    }

    game.snake.unshift(head);

    if (U.posEq(head, game.food)) {
        game.score++;
        game.updateScore();
        placeFood(game);
        game.spawnFx(head.x, head.y);
        game.beep(660);
        if (game.tickMs > C.MIN_TICK) game.tickMs -= C.SPEED_STEP;

        // Snake glow effect
        game.animateGlow(1, 300); // Animate to full glow in 300ms
        if (game.snakeGlowTimer) clearTimeout(game.snakeGlowTimer);
        game.snakeGlowTimer = setTimeout(() => {
            game.animateGlow(0, 500); // Animate back to no glow in 500ms
        }, 2000); // Strong glow for 2 seconds
    } else {
        game.snake.pop();
    }

    game.turnLocked = false;
}

export function gameLoop(game, currentTime) {
    game.gameLoopId = requestAnimationFrame(ts => gameLoop(game, ts));
    
    // Only update game logic if running and not paused
    if (game.running && !game.paused) {
        const timeSinceLastTick = currentTime - game.lastTickTime;
        if (timeSinceLastTick > game.tickMs) {
            game.lastTickTime = currentTime;
            game.tick();
        }
    }

    // Always draw if not paused (even if game is over)
    if (!game.paused) {
        draw(game, currentTime);
    }
}

export function spawnFx(game, x, y) {
    if (!settings.sound) return;
    game.effects.push({ x: x * game.cellSize + game.cellSize / 2, y: y * game.cellSize + game.cellSize / 2, r: 0, alpha: 1 });
}

export function beep(game, freq = 440, dur = 0.05) {
    if (!settings.sound) return;
    if (!game.audioCtx) game.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = game.audioCtx.createOscillator();
    const gain = game.audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(game.audioCtx.destination);
    osc.start();
    osc.stop(game.audioCtx.currentTime + dur);
}

export function setDirection(game, newDir) {
    console.log('setDirection called. game.running:', game.running, 'game.turnLocked:', game.turnLocked);
    if (!game.running || game.turnLocked) {
        console.log('setDirection returning early. Not running or turn locked.');
        return;
    }
    
    const isOpposite = (d1, d2) => d1.x === -d2.x || d1.y === -d2.y;
    if (isOpposite(game.dir, newDir)) {
        console.log('setDirection returning early. Opposite direction.');
        return;
    }

    game.nextDir = newDir;
    game.turnLocked = true;
    console.log('Direction set to:', newDir);
}

export function handleKeydown(game, e) {
    if (e.code === 'Space') {
        game.togglePause();
        return;
    }

    let newDir;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') newDir = { x: 0, y: -1 };
    if (e.code === 'ArrowDown' || e.code === 'KeyS') newDir = { x: 0, y: 1 };
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') newDir = { x: -1, y: 0 };
    if (e.code === 'ArrowRight' || e.code === 'KeyD') newDir = { x: 1, y: 0 };
    
    if (newDir) game.setDirection(newDir);
}

export function countdown(game, seconds) {
    if (seconds > 0) {
        drawCountdown(game, seconds);
        game.beep(440, 0.05);
        setTimeout(() => countdown(game, seconds - 1), 1000);
    } else {
        draw(game);
        game.running = true;
        gameLoop(game, 0);
        game.beep(880, 0.05);
    }
}

export function startGame(game) {
    game.resetGame();
    game.countdown(3);
}

export function togglePause(game) {
    if (!game.running) return;
    game.paused = !game.paused;
    C.PAUSED_OVERLAY.classList.toggle('show', game.paused);
}

export function stop(game) {
    game.running = false;
    if (game.gameLoopId) {
        cancelAnimationFrame(game.gameLoopId);
        game.gameLoopId = null;
    }
}

export function gameOver(game, noDraw) {
    game.beep(220, 0.1);
    game.running = false;
    game.isGameOver = true; // Set game over flag
    game.scannerProgress = 0; // Reset scanner progress
    if (game.gameLoopId) {
        cancelAnimationFrame(game.gameLoopId);
        game.gameLoopId = null;
    }
    // The drawing of the game over screen is handled by the draw() function.
}

export function animateGlow(game, targetIntensity, duration) {
    const startIntensity = game.currentGlowIntensity;
    const startTime = Date.now();

    const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(1, elapsed / duration);
        // Ease-in-out for smoother transition
        const easedProgress = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

        game.currentGlowIntensity = startIntensity + (targetIntensity - startIntensity) * easedProgress;

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };
    requestAnimationFrame(animate);
}

export function animateScanner(game, duration, callback) {
    const startTime = Date.now();
    console.log('Starting scanner animation...');

    const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(1, elapsed / duration);
        
        game.scannerProgress = progress;
        console.log('Scanner progress:', game.scannerProgress);

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else if (callback) {
            callback();
        }
    };
    requestAnimationFrame(animate);
}