import { supabase } from '../lib/supabaseClient.js';
import * as C from '../config/constants.js';
import * as U from '../utils/utils.js';
import { settings } from '../features/settings.js';
import { draw, drawCountdown } from './rendering.js';
import { updateSnakeColor, updateObstacleColor } from '../config/colors.js';
import { sfx } from '../sound/sfx.js';
import { audioManager } from '../sound/audio.js';
import { showConfirmationModal } from '../ui/modal.js';
import { POWER_UP_TYPES, POWER_UP_CONFIG } from '../config/powerups.js';
import { createShrinkParticles, createObstacleClearParticles, createSlowDownTrail } from '../fx/particles.js';
import { triggerBombAnimation, triggerShrinkAnimation } from '../fx/animationManager.js';
import { changeAndAnimateObstacles, generateObstacles, inObstacle } from './gameLogic/obstacles.js';
import { placeFood } from './gameLogic/food.js';
import { spawnPowerUp, activatePowerUp, deactivatePowerUp, activateImmunity, isSelfColliding, getExpressionForPowerUp } from './gameLogic/powerups.js';
import { playSoundWithDucking } from './gameLogic/audioHelpers.js';

// Re-export modularized functions so other modules can still import from this file
export { changeAndAnimateObstacles, generateObstacles, inObstacle };
export { placeFood };
export { spawnPowerUp, activatePowerUp, deactivatePowerUp, activateImmunity, isSelfColliding, getExpressionForPowerUp };
export { playSoundWithDucking };

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

    // Reset head blink/focus
    game.headBlinkActive = false;
    game.nextHeadBlinkTime = Date.now() + (game.headBlinkInterval || 3000);
    game.headBlinkEndTime = 0;
    game.focusTarget = null;

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

    // Guardar puntuación en Supabase
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.log("No hay usuario logueado, no se puede guardar el puntaje.");
            return;
        }

        // Buscar si ya existe un registro de puntuación para este usuario
        const { data: existingScore, error: fetchError } = await supabase
            .from('puntuaciones')
            .select('id, best_score')
            .eq('user_id', user.id)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            // PGRST116 = no rows found, lo cual es normal para nuevos usuarios
            console.error('Error buscando puntuación:', fetchError);
            return;
        }

        if (!existingScore) {
            // Primera puntuación del usuario - insertar nuevo registro
            const { error: insertError } = await supabase
                .from('puntuaciones')
                .insert({ user_id: user.id, best_score: game.score });

            if (insertError) {
                console.error('Error insertando puntuación:', insertError);
            } else {
                console.log('¡Nueva puntuación registrada!', game.score);
            }
        } else if (game.score > existingScore.best_score) {
            // Nuevo récord - actualizar registro
            const { error: updateError } = await supabase
                .from('puntuaciones')
                .update({ best_score: game.score, updated_at: new Date().toISOString() })
                .eq('id', existingScore.id);

            if (updateError) {
                console.error('Error actualizando puntuación:', updateError);
            } else {
                console.log('¡Nuevo récord!', game.score);
            }
        } else {
            console.log('Puntuación no supera el récord actual:', existingScore.best_score);
        }
    } catch (error) {
        console.error('Error al guardar puntuación:', error.message);
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

/* spawn/activate/deactivate power-up logic moved to js/core/gameLogic/powerups.js */

/* NOTE: spawn/activate/deactivate power-up functions moved to
   js/core/gameLogic/powerups.js. This block was removed to keep
   implementation modular. */
