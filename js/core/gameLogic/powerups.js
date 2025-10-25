import * as C from '../../config/constants.js';
import * as U from '../../utils/utils.js';
import { settings } from '../../features/settings.js';
import { updateSnakeColor } from '../../config/colors.js';
import { POWER_UP_TYPES, POWER_UP_CONFIG } from '../../config/powerups.js';
import { createShrinkParticles, createObstacleClearParticles, createSlowDownTrail } from '../../fx/particles.js';
import { triggerBombAnimation, triggerShrinkAnimation } from '../../fx/animationManager.js';
import { playSoundWithDucking } from './audioHelpers.js';
import { inObstacle } from './obstacles.js';
import { placeFood } from './food.js';

// Note: _internal_helpers.js will contain small helpers like isSelfColliding if needed.

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

export function getExpressionForPowerUp(powerUpType) {
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

export function activatePowerUp(game, powerUp) {
    if (game.activePowerUp.timeoutId) {
        clearTimeout(game.activePowerUp.timeoutId);
    }

    game.activePowerUp.type = powerUp.type;
    game.expression = getExpressionForPowerUp(powerUp.type);

    // Save previous visual state so we can restore it later
    if (!game._prevPowerupColors) {
        game._prevPowerupColors = {
            snakeBodyColor: game.snakeBodyColor,
            snakeHeadColor: game.snakeHeadColor,
            snakeGlowSubtle: game.snakeGlowSubtle,
            snakeGlowStrongColor: game.snakeGlowStrongColor
        };
    }

    switch (powerUp.type) {
        case POWER_UP_TYPES.IMMUNITY.type:
            playSoundWithDucking('immunity');
            // Lightweight visual: set small glow colors (do not mutate base colors)
            const immSubtle = 'rgba(255,255,255,0.18)';
            const immStrong = 'rgba(255,255,255,0.38)';
            game.immunityOverlay = { subtle: immSubtle, strong: immStrong };
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
            // Visual: make snake golden and glow
            game.pointsMultiplier = 2;
            const body = '#b89010';
            const head = '#ffd54a';
            const subtle = 'rgba(184, 144, 16, 0.25)';
            const strong = 'rgba(255, 213, 74, 0.7)';
            // Set CSS vars so styles pick up and update game cache
            U.setCssVar('--snake', body);
            U.setCssVar('--snake-head', head);
            U.setCssVar('--snake-glow-subtle', subtle);
            U.setCssVar('--snake-glow-strong', strong);
            game.snakeBodyColor = body;
            game.snakeHeadColor = head;
            game.snakeGlowSubtle = subtle;
            game.snakeGlowStrongColor = strong;
            // Start a pulsing effect for the duration
            if (game._doublePointsPulseInterval) clearInterval(game._doublePointsPulseInterval);
            // Trigger an immediate, softer/faster pulse and schedule repeating pulses
            const DP_PULSE_TARGET = 0.8; // softer than full
            const DP_PULSE_UP_MS = 200; // faster rise
            const DP_PULSE_DOWN_MS = 300; // faster fall
            const DP_PULSE_INTERVAL = 700; // slightly faster repeat

            game.animateGlow(DP_PULSE_TARGET, DP_PULSE_UP_MS);
            if (game._doublePointsPulseInterval) clearInterval(game._doublePointsPulseInterval);
            game._doublePointsPulseInterval = setInterval(() => {
                game.animateGlow(DP_PULSE_TARGET, DP_PULSE_UP_MS);
                setTimeout(() => game.animateGlow(0, DP_PULSE_DOWN_MS), DP_PULSE_UP_MS);
            }, DP_PULSE_INTERVAL);

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
            // Remove lightweight visual overlay
            if (game.immunityOverlay) delete game.immunityOverlay;
            break;
        case POWER_UP_TYPES.DOUBLE_POINTS.type:
            game.pointsMultiplier = 1;
            // Restore previous colors
            if (game._prevPowerupColors) {
                U.setCssVar('--snake', game._prevPowerupColors.snakeBodyColor);
                U.setCssVar('--snake-head', game._prevPowerupColors.snakeHeadColor);
                U.setCssVar('--snake-glow-subtle', game._prevPowerupColors.snakeGlowSubtle);
                U.setCssVar('--snake-glow-strong', game._prevPowerupColors.snakeGlowStrongColor);
                game.snakeBodyColor = game._prevPowerupColors.snakeBodyColor;
                game.snakeHeadColor = game._prevPowerupColors.snakeHeadColor;
                game.snakeGlowSubtle = game._prevPowerupColors.snakeGlowSubtle;
                game.snakeGlowStrongColor = game._prevPowerupColors.snakeGlowStrongColor;
                delete game._prevPowerupColors;
            } else {
                // Fallback: recalc colors based on score
                updateSnakeColor(game);
            }
            // Clear pulsing interval if set
            if (game._doublePointsPulseInterval) {
                clearInterval(game._doublePointsPulseInterval);
                game._doublePointsPulseInterval = null;
            }
            break;
        case POWER_UP_TYPES.SLOW_DOWN.type:
            if (game.originalTickMs > 0) {
                game.tickMs = game.originalTickMs;
                game.originalTickMs = 0;
            }
            // Restore previous colors for slow down as well
            if (game._prevPowerupColors) {
                U.setCssVar('--snake', game._prevPowerupColors.snakeBodyColor);
                U.setCssVar('--snake-head', game._prevPowerupColors.snakeHeadColor);
                U.setCssVar('--snake-glow-subtle', game._prevPowerupColors.snakeGlowSubtle);
                U.setCssVar('--snake-glow-strong', game._prevPowerupColors.snakeGlowStrongColor);
                game.snakeBodyColor = game._prevPowerupColors.snakeBodyColor;
                game.snakeHeadColor = game._prevPowerupColors.snakeHeadColor;
                game.snakeGlowSubtle = game._prevPowerupColors.snakeGlowSubtle;
                game.snakeGlowStrongColor = game._prevPowerupColors.snakeGlowStrongColor;
                delete game._prevPowerupColors;
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

    // Ensure immunity overlay exists (covers both direct activation and power-up activation paths)
        // Ensure lightweight immunity visual is present for both power-up activation and auto-activation
        if (!game.immunityOverlay) {
            // Convert snakeBodyColor (hex or rgb) to rgba with low alpha so the glow
            // uses the snake color but remains subtle.
            const toRgba = (hexOrRgb, a) => {
                if (!hexOrRgb) return `rgba(255,255,255,${a})`;
                // If already rgb/rgba, try to extract numbers
                const rgbMatch = hexOrRgb.match(/rgba?\(([^)]+)\)/);
                if (rgbMatch) {
                    const parts = rgbMatch[1].split(',').map(s => parseInt(s.trim(), 10));
                    return `rgba(${parts[0]},${parts[1]},${parts[2]},${a})`;
                }
                // Normalize hex (#rrggbb or #rgb)
                let hex = hexOrRgb.replace('#', '').trim();
                if (hex.length === 3) {
                    hex = hex.split('').map(h => h + h).join('');
                }
                const num = parseInt(hex, 16);
                const r = (num >> 16) & 255;
                const g = (num >> 8) & 255;
                const b = num & 255;
                return `rgba(${r},${g},${b},${a})`;
            };

            // Use snake body color with low alpha for subtle and slightly higher for strong.
            const baseColor = game.snakeBodyColor || '#ffffff';
            const immSubtle = toRgba(baseColor, 0.12); // less intense subtle
            const immStrong = toRgba(baseColor, 0.28); // less intense strong
            game.immunityOverlay = { subtle: immSubtle, strong: immStrong };
        }

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
