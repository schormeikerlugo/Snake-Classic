import { supabase } from '../lib/supabaseClient.js';
import * as C from '../config/constants.js';
import * as U from '../utils/utils.js';
import { settings } from '../features/settings.js';
import { draw,drawCountdown } from './rendering.js';
import { updateSnakeColor, updateObstacleColor } from '../config/colors.js';
import { sfx } from '../sound/sfx.js';
import { audioManager } from '../sound/audio.js';
import { showConfirmationModal } from '../ui/modal.js';
import { POWER_UP_TYPES, POWER_UP_CONFIG } from '../config/powerups.js';
import { createShrinkParticles, createObstacleClearParticles, createSlowDownTrail } from '../fx/particles.js';
import { triggerBombAnimation, triggerShrinkAnimation } from '../fx/animationManager.js';

/**
 * Devuelve la expresión facial correspondiente a un tipo de power-up.
 * @param {string} powerUpType - El tipo de power-up.
 * @returns {string} La expresión correspondiente.
 */
function getExpressionForPowerUp(powerUpType) {
    switch (powerUpType) {
        case POWER_UP_TYPES.IMMUNITY.type:
        case POWER_UP_TYPES.DOUBLE_POINTS.type:
            return 'aggressive';
        case POWER_UP_TYPES.SLOW_DOWN.type:
            return 'relaxed';
        case POWER_UP_TYPES.SHRINK.type:
            return 'surprised';
        case POWER_UP_TYPES.CLEAR_OBSTACLES.type:
            return 'focused';
        default:
            return 'normal';
    }
}

/**
 * Helper function to play a sound with audio ducking.
 * @param {string} soundName - The name of the sound to play.
 */
function playSoundWithDucking(soundName) {
    audioManager.fadeVolume(audioManager.gameMusicGain, audioManager.baseGameVolume * settings.masterVolume * 0.3, 150)
        .then(() => {
            sfx.play(soundName);
            // Estimate sound duration, or use a fixed delay
            setTimeout(() => {
                audioManager.fadeVolume(audioManager.gameMusicGain, audioManager.baseGameVolume * settings.masterVolume, 400);
            }, 1000); // Adjusted delay for sound to play out
        });
}


export function changeAndAnimateObstacles(game) {
    game.paused = true;
    game.isGlitching = true;
    game.glitchStartTime = Date.now();
    game.oldObstacles = [...game.obstacles]; // Guardar estado anterior

    C.canvas.classList.add('glitch-effect'); // Aplicar efecto al canvas

    generateObstacles(game, true); // Generar nuevos obstáculos inmediatamente

    const glitchDuration = 500; // Duración del efecto en ms

    setTimeout(() => {
        game.isGlitching = false;
        game.oldObstacles = [];
        if (game.running) {
            game.paused = false;
        }
        C.canvas.classList.remove('glitch-effect'); // Quitar efecto del canvas
    }, glitchDuration);
}

export function generateObstacles(game, isDynamic = false) {
    game.obstacles = [];

    // For dynamic changes, generate random obstacles
    if (isDynamic && settings.obstacles) {
        const numObstacles = U.randInt(3, 6); // Generate 3 to 6 obstacle clusters
        for (let i = 0; i < numObstacles; i++) {
            const obstacleWidth = U.randInt(1, 4); // Width from 1 to 3
            const obstacleHeight = U.randInt(1, 4); // Height from 1 to 3
            
            // Ensure obstacles don't spawn too close to the edges
            const startX = U.randInt(2, game.cols - 2 - obstacleWidth);
            const startY = U.randInt(2, game.rows - 2 - obstacleHeight);

            for (let w = 0; w < obstacleWidth; w++) {
                for (let h = 0; h < obstacleHeight; h++) {
                    const pos = { x: startX + w, y: startY + h };
                    // Avoid placing on snake, other obstacles, or too close to the snake head
                    if (!game.inSnake(pos) && !inObstacle(game, pos) && (Math.abs(pos.x - game.snake[0].x) > 3 || Math.abs(pos.y - game.snake[0].y) > 3)) {
                        game.obstacles.push(pos);
                    }
                }
            }
        }
    } else if (settings.obstacles) {
        // Original static obstacles for the start of the game
        const center_x = Math.floor(game.cols / 2);
        const center_y = Math.floor(game.rows / 2);
        for (let i = 0; i < 8; i++) {
            game.obstacles.push({ x: center_x - 5, y: center_y - 4 + i });
            game.obstacles.push({ x: center_x + 5, y: center_y - 4 + i });
        }
    }
}

export function inObstacle(game, pos) {
    return game.obstacles.some(obstacle => U.posEq(obstacle, pos));
}

export function placeFood(game) {
    let tries = 0;
    while (true) {
        const c = { x: U.randInt(0, game.cols - 1), y: U.randInt(0, game.rows - 1) };
        if (!game.inSnake(c) && !inObstacle(game, c)) {
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

    if (settings.obstacles) {
        generateObstacles(game, false); // Generate static obstacles at start
    } else {
        game.obstacles = [];
    }

    placeFood(game);
    game.score = 0;
    game.tickMs = C.INITIAL_TICK_MS;
    game.running = false;
    game.paused = false;
    game.isGameOver = false;
    game.scannerProgress = 0;
    game.updateScore();

    // Reset power-ups and expressions
    if (game.activePowerUp.timeoutId) clearTimeout(game.activePowerUp.timeoutId);
    if (game.powerUpSpawnTimer) clearTimeout(game.powerUpSpawnTimer);
    if (game.expressionTimeoutId) clearTimeout(game.expressionTimeoutId);
    game.powerUps = [];
    game.activePowerUp = { type: null, timeoutId: null };
    game.isImmune = false;
    game.pointsMultiplier = 1;
    game.lastPowerUpType = null;
    game.expression = 'normal';

    // Inicializar/restablecer colores y música
    updateSnakeColor(game);
    updateObstacleColor(game, true); // MODIFIED: Reset obstacle color
    game.gridColor = U.getCssVar('--grid');
    game.foodColor = U.getCssVar('--food');
    audioManager.restoreGameMusic();

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
    game.prevSnake = [...game.snake];
    game.dir = game.nextDir;
    let head = { x: game.snake[0].x + game.dir.x, y: game.snake[0].y + game.dir.y };

    const isWallCollision = head.x < 0 || head.y < 0 || head.x >= game.cols || head.y >= game.rows;
    const isSelfCollision = game.inSnake(head);
    const isObstacleCollision = inObstacle(game, head);

    if (game.isImmune) {
        if (isWallCollision) {
            if (head.x < 0) head.x = game.cols - 1;
            if (head.x >= game.cols) head.x = 0;
            if (head.y < 0) head.y = game.rows - 1;
            if (head.y >= game.rows) head.y = 0;
        }
    } else {
        if (isWallCollision || isSelfCollision || isObstacleCollision) {
            game.gameOver();
            return;
        }
    }

    game.snake.unshift(head);

    // Check for power-up collection
    const powerUpIndex = game.powerUps.findIndex(p => U.posEq(head, p));
    if (powerUpIndex !== -1) {
        const powerUp = game.powerUps[powerUpIndex];
        game.powerUps.splice(powerUpIndex, 1); // Remove power-up
        activatePowerUp(game, powerUp);
    }

    if (U.posEq(head, game.food)) {
        game.score += game.pointsMultiplier;
        game.updateScore();
        updateSnakeColor(game); // This also updates obstacle color

        // Efecto de parpadeo
        if (game.expressionTimeoutId) clearTimeout(game.expressionTimeoutId);
        game.expression = 'blink';
        game.expressionTimeoutId = setTimeout(() => {
            game.expression = game.activePowerUp.type ? getExpressionForPowerUp(game.activePowerUp.type) : 'normal';
        }, 150);

        // Create particle effect before placing new food
        createShrinkParticles(game.food.x, game.food.y, game.foodColor, game.cellSize);

        placeFood(game);
        game.spawnFx(head.x, head.y);

        // MODIFIED: Sonido de comer o bonus y cambio de obstáculos
        if (game.score > 0 && game.score % 10 === 0) {
            playSoundWithDucking('bonus');
            changeAndAnimateObstacles(game); // Call the new function
            activateImmunity(game, 5000); // 5 seconds of immunity
        } else {
            sfx.play('eat');
        }

        if (game.tickMs > C.MIN_TICK) game.tickMs -= C.SPEED_STEP;

        game.animateGlow(1, 300);
        if (game.snakeGlowTimer) clearTimeout(game.snakeGlowTimer);
        game.snakeGlowTimer = setTimeout(() => {
            game.animateGlow(0, 500);
        }, 2000);
    } else {
        game.snake.pop();
    }

    // SLOW_DOWN particle trail effect
    if (game.activePowerUp && game.activePowerUp.type === 'SLOW_DOWN') {
        const tail = game.snake[game.snake.length - 1];
        if (tail) {
            createSlowDownTrail(tail.x, tail.y, game.cellSize);
        }
    }

    game.turnLocked = false;
}

export function gameLoop(game, currentTime) {
    game.gameLoopId = requestAnimationFrame(ts => gameLoop(game, ts));

    // Remove expired power-ups
    const now = Date.now();
    game.powerUps = game.powerUps.filter(p => (now - p.spawnTime) < 10000);

    // Actualizar el pulso de brillo del obstáculo
    game.obstacleGlowProgress = (Math.sin(currentTime / 1000) + 1) / 2; // Oscila entre 0 y 1 (más lento)
    
    // Actualizar el pulso de brillo de los power-ups (más rápido)
    game.powerUpGlowProgress = (Math.sin(currentTime / 250) + 1) / 2;

    if (game.running && !game.paused) {
        const timeSinceLastTick = currentTime - game.lastTickTime;
        if (timeSinceLastTick > game.tickMs) {
            game.lastTickTime = currentTime;
            game.tick();
        }
    }

    if (!game.paused || game.isGlitching) {
        draw(game, currentTime);
    }
}

export function spawnFx(game, x, y) {
    if (!settings.sound) return;
    game.effects.push({ x: x * game.cellSize + game.cellSize / 2, y: y * game.cellSize + game.cellSize / 2, r: 0, alpha: 1 });
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
        setTimeout(() => countdown(game, seconds - 1), 1000);
    } else {
        draw(game);
        game.running = true;
        gameLoop(game, 0);
    }
}

export function startGame(game) {
    game.resetGame();
    if (game.powerUpSpawnTimer) clearTimeout(game.powerUpSpawnTimer);
    game.powerUpSpawnTimer = setTimeout(() => spawnPowerUp(game), POWER_UP_CONFIG.spawnInterval);
    game.countdown(3);
}

export function togglePause(game) {
    if (!game.running) return;
    game.paused = !game.paused;
    C.PAUSED_OVERLAY.classList.toggle('show', game.paused);
    if (game.paused) {
        sfx.play('pause');
    }
}

export function stop(game) {
    game.running = false;
    if (game.gameLoopId) {
        cancelAnimationFrame(game.gameLoopId);
        game.gameLoopId = null;
    }
}

export async function gameOver(game) {
    console.log('--- GAME OVER --- La función ha sido llamada.');
    sfx.play('gameOver');
    audioManager.duckGameMusic();
    game.running = false;
    game.isGameOver = true;
    game.scannerProgress = 0;
    if (game.gameLoopId) {
        cancelAnimationFrame(game.gameLoopId);
        game.gameLoopId = null;
    }

    // Clear power-up timers
    if (game.activePowerUp.timeoutId) clearTimeout(game.activePowerUp.timeoutId);
    if (game.powerUpSpawnTimer) clearTimeout(game.powerUpSpawnTimer);

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.log("No hay usuario logueado, no se puede guardar el puntaje.");
            return;
        }

        const { error } = await supabase.functions.invoke('submit-score', {
            body: { user_id: user.id, score: game.score },
        });

        if (error) throw error;
        console.log('Puntaje enviado correctamente.');
    } catch (error) {
        console.error('Error al enviar el puntaje:', error.message);
    }
}

export function animateGlow(game, targetIntensity, duration) {
    const startIntensity = game.currentGlowIntensity;
    const startTime = Date.now();

    const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(1, elapsed / duration);
        const easedProgress = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

        game.currentGlowIntensity = startIntensity + (targetIntensity - startIntensity) * easedProgress;

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };
    requestAnimationFrame(animate);
}
export function requestRestart(game) {
    if (game.running && !game.isGameOver) {
        const wasPaused = game.paused;
        if (!wasPaused) {
            game.togglePause();
        }
        showConfirmationModal(
            'Reiniciar Partida',
            '¿Seguro que quieres reiniciar la partida actual?',
            () => {
                game.startGame();
            },
            () => {
                if (!wasPaused) {
                    game.togglePause();
                }
            }
        );
    } else {
        game.startGame();
    }
}

export function spawnPowerUp(game) {
    if (!game.running) return;

    // Probabilities for each power-up type
    const weightedPowerUps = [
        { type: POWER_UP_TYPES.SLOW_DOWN, weight: game.score >= 25 ? 3 : 0 },
        { type: POWER_UP_TYPES.DOUBLE_POINTS, weight: 2 },
        { type: POWER_UP_TYPES.IMMUNITY, weight: 2 },
        { type: POWER_UP_TYPES.SHRINK, weight: game.score >= 25 ? 1 : 0 },
        { type: POWER_UP_TYPES.CLEAR_OBSTACLES, weight: 1 },
        { type: POWER_UP_TYPES.BOMB, weight: 1 },
    ];

    // Reduce weight of last spawned power-up to avoid repetition
    if (game.lastPowerUpType) {
        const last = weightedPowerUps.find(p => p.type.type === game.lastPowerUpType);
        if (last) {
            last.weight *= 0.2; // Reduce weight to 20% of original
        }
    }

    const totalWeight = weightedPowerUps.reduce((sum, p) => sum + p.weight, 0);
    if (totalWeight === 0) {
        if (game.powerUpSpawnTimer) clearTimeout(game.powerUpSpawnTimer);
        game.powerUpSpawnTimer = setTimeout(() => spawnPowerUp(game), POWER_UP_CONFIG.spawnInterval);
        return;
    }

    let random = Math.random() * totalWeight;
    let chosenType = null;

    for (const p of weightedPowerUps) {
        if (random < p.weight) {
            chosenType = p.type;
            break;
        }
        random -= p.weight;
    }

    if (!chosenType) {
        // Fallback: find first available power-up
        chosenType = weightedPowerUps.find(p => p.weight > 0)?.type || POWER_UP_TYPES.SLOW_DOWN;
    }

    game.lastPowerUpType = chosenType.type; // Store last spawned type

    let pos;
    let tries = 0;
    while (true) {
        pos = { x: U.randInt(0, game.cols - 1), y: U.randInt(0, game.rows - 1) };
        if (!game.inSnake(pos) && !inObstacle(game, pos) && !game.powerUps.some(p => U.posEq(p, pos))) {
            break;
        }
        if (++tries > 500) {
            console.warn("Could not find a valid position for a new power-up.");
            if (game.powerUpSpawnTimer) clearTimeout(game.powerUpSpawnTimer);
            game.powerUpSpawnTimer = setTimeout(() => spawnPowerUp(game), POWER_UP_CONFIG.spawnInterval);
            return;
        }
    }

    const newPowerUp = {
        ...chosenType,
        x: pos.x,
        y: pos.y,
        spawnTime: Date.now(), // Track spawn time
    };

    game.powerUps.push(newPowerUp);
    console.log(`Spawned power-up: ${newPowerUp.type} at`, pos);

    if (game.powerUpSpawnTimer) clearTimeout(game.powerUpSpawnTimer);
    game.powerUpSpawnTimer = setTimeout(() => spawnPowerUp(game), POWER_UP_CONFIG.spawnInterval);
}


export function activatePowerUp(game, powerUp) {
    if (game.activePowerUp.timeoutId) {
        clearTimeout(game.activePowerUp.timeoutId);
        deactivatePowerUp(game, game.activePowerUp.type);
    }

    game.activePowerUp.type = powerUp.type;
    game.expression = getExpressionForPowerUp(powerUp.type);

    switch (powerUp.type) {
        case POWER_UP_TYPES.IMMUNITY.type:
            playSoundWithDucking('immunity');
            activateImmunity(game, powerUp.duration);
            break;

        case POWER_UP_TYPES.SLOW_DOWN.type:
            playSoundWithDucking('slowDown');
            if (game.originalTickMs === 0) {
                game.originalTickMs = game.tickMs;
                game.tickMs *= 1.5; // 50% slower
                game.activePowerUp.timeoutId = setTimeout(() => {
                    deactivatePowerUp(game, POWER_UP_TYPES.SLOW_DOWN.type);
                }, powerUp.duration);
            }
            break;

        case POWER_UP_TYPES.DOUBLE_POINTS.type:
            playSoundWithDucking('doublePoints');
            game.pointsMultiplier = 2;
            game.activePowerUp.timeoutId = setTimeout(() => {
                deactivatePowerUp(game, POWER_UP_TYPES.DOUBLE_POINTS.type);
            }, powerUp.duration);
            break;

        case POWER_UP_TYPES.SHRINK.type:
            playSoundWithDucking('shrink');
            if (game.snake.length > 3) {
                const segmentsToRemoveCount = Math.floor(game.snake.length / 3);
                const removedSegments = game.snake.slice(-segmentsToRemoveCount);

                // Create particles for each removed segment
                removedSegments.forEach(seg => {
                    createShrinkParticles(seg.x, seg.y, game.snakeBodyColor, game.cellSize);
                });

                game.snake.splice(game.snake.length - segmentsToRemoveCount);
                triggerShrinkAnimation(removedSegments);
            }
            break;

        case POWER_UP_TYPES.CLEAR_OBSTACLES.type:
            playSoundWithDucking('clearObstacles');
            if (settings.obstacles) {
                createObstacleClearParticles(game.obstacles, game.obstacleColor, game.cellSize);
                game.obstacles = [];
            }
            break;

        case POWER_UP_TYPES.BOMB.type:
            playSoundWithDucking('bomb');
            triggerBombAnimation(game.snake);
            game.score = Math.max(0, game.score - 5); // Subtract 5 points, min 0
            game.updateScore();
            placeFood(game);
            // Optional: Add a small screen shake or visual effect
            break;
        
        default:
            playSoundWithDucking('bonus'); // Fallback for any other case
            break;
    }
}

export function deactivatePowerUp(game, powerUpType) {
    if (!powerUpType) return;

    console.log('Deactivating power-up:', powerUpType);
    game.expression = 'normal'; // Reset expression

    switch (powerUpType) {
        case POWER_UP_TYPES.IMMUNITY.type:
            // Logic is handled by the timeout in activateImmunity
            break;
        case POWER_UP_TYPES.DOUBLE_POINTS.type:
            game.pointsMultiplier = 1;
            break;
        case POWER_UP_TYPES.SLOW_DOWN.type:
            if (game.originalTickMs > 0) {
                game.tickMs = game.originalTickMs;
                game.originalTickMs = 0;
            }
            break;
    }
    // Clear active power-up state after deactivation
    game.activePowerUp.type = null;
    game.activePowerUp.timeoutId = null;
}


export function isSelfColliding(game) {
    if (game.snake.length < 2) return false;
    const head = game.snake[0];
    return game.snake.slice(1).some(seg => U.posEq(head, seg));
}

export function activateImmunity(game, duration) {
    if (game.activePowerUp.type === 'IMMUNITY' && game.activePowerUp.timeoutId) {
        clearTimeout(game.activePowerUp.timeoutId);
    }

    game.isImmune = true;
    game.expression = 'aggressive'; // Set expression for immunity
    console.log(`Immunity activated for ${duration}ms`);

    const endImmunity = () => {
        if (inObstacle(game, game.snake[0]) || isSelfColliding(game)) {
            game.activePowerUp.timeoutId = setTimeout(endImmunity, 100);
        } else {
            game.isImmune = false;
            deactivatePowerUp(game, POWER_UP_TYPES.IMMUNITY.type);
        }
    };

    game.activePowerUp.type = 'IMMUNITY';
    game.activePowerUp.timeoutId = setTimeout(endImmunity, duration);
}
