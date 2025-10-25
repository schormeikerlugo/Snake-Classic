import * as C from '../config/constants.js';
import * as U from '../utils/utils.js';
import { settings } from '../features/settings.js';
import { updateAndDrawParticles } from '../fx/particles.js';
import { updateAndDrawAnimations } from '../fx/animationManager.js';
import { drawSnake } from './rendering/snake.js';
import { drawCell } from './rendering/cell.js';
import { drawPowerUp } from './rendering/powerup.js';
import { drawFx } from './rendering/fx.js';

// Re-export drawFx so other modules can import it from the facade
export { drawFx };

export function draw(game, currentTime) {
    if (game.running) {
        C.ctx.clearRect(0, 0, C.canvas.width, C.canvas.height);
    }

    if (game.running || game.paused) {
        C.ctx.strokeStyle = game.gridColor;
        C.ctx.lineWidth = 1;
        for (let i = 1; i < game.cols; i++) {
            C.ctx.beginPath();
            C.ctx.moveTo(i * game.cellSize, 0);
            C.ctx.lineTo(i * game.cellSize, C.canvas.height);
            C.ctx.stroke();
        }
        for (let i = 1; i < game.rows; i++) {
            C.ctx.beginPath();
            C.ctx.moveTo(0, i * game.cellSize);
            C.ctx.lineTo(C.canvas.width, i * game.cellSize);
            C.ctx.stroke();
        }

        const isMobile = window.innerWidth <= 768;

        if (settings.obstacles) {
            if (game.isGlitching) {
                const glitchDuration = 500;
                const elapsed = Date.now() - game.glitchStartTime;
                const progress = Math.min(1, elapsed / glitchDuration);

                C.ctx.globalAlpha = 1 - progress;
                game.oldObstacles.forEach(obstacle => {
                    const xOffset = (Math.random() - 0.5) * 15;
                    const yOffset = (Math.random() - 0.5) * 15;
                    drawCell(game, obstacle.x + xOffset / game.cellSize, obstacle.y + yOffset / game.cellSize, game.obstacleColor, isMobile, null, 'normal', null, false);
                });

                C.ctx.globalAlpha = progress;
                game.obstacles.forEach(obstacle => {
                    const xOffset = (Math.random() - 0.5) * (1 - progress) * 20;
                    const yOffset = (Math.random() - 0.5) * (1 - progress) * 20;
                    drawCell(game, obstacle.x + xOffset / game.cellSize, obstacle.y + yOffset / game.cellSize, game.obstacleColor, isMobile, null, 'normal', null, false);
                });

                C.ctx.globalAlpha = 1;
            } else {
                C.ctx.shadowColor = game.obstacleColor;
                C.ctx.shadowBlur = 5 + (game.obstacleGlowProgress * 15);

                game.obstacles.forEach(obstacle => {
                    drawCell(game, obstacle.x, obstacle.y, game.obstacleColor, isMobile, null, 'normal', null, false);
                });
                
                C.ctx.shadowBlur = 0;
                C.ctx.shadowColor = 'transparent';
            }
        }

        game.powerUps.forEach(p => {
            C.ctx.shadowColor = p.color;
            C.ctx.shadowBlur = 5 + (game.powerUpGlowProgress * 15);
            drawPowerUp(game, p);
        });
        C.ctx.shadowBlur = 0;
        C.ctx.shadowColor = 'transparent';

        if (game.food.x !== undefined) {
            drawCell(game, game.food.x, game.food.y, game.foodColor, isMobile, null, 'normal', null, false);
        }

        let alpha = 1;
        if (game.running && game.prevSnake.length > 0) {
            alpha = (currentTime - game.lastTickTime) / game.tickMs;
            if (alpha > 1) alpha = 1;
        }

        // --- Head passive blinking and focus target calculation ---
        const now = Date.now();
        // Manage passive blink timing (do not blink passively when immune)
        if (!game.isImmune) {
            if (!game.nextHeadBlinkTime) game.nextHeadBlinkTime = now + (game.headBlinkInterval || 3000);
            if (!game.headBlinkActive && now >= game.nextHeadBlinkTime) {
                game.headBlinkActive = true;
                game.headBlinkEndTime = now + (game.headBlinkDuration || 150);
                // Schedule next blink
                game.nextHeadBlinkTime = now + (game.headBlinkInterval || 3000);
            }
        }
        if (game.headBlinkActive && now >= game.headBlinkEndTime) {
            game.headBlinkActive = false;
        }

        // Calculate focus target (food has priority if distances are equal)
        game.focusTarget = null;
        try {
            const head = game.snake[0];
            if (head) {
                let best = { type: null, x: null, y: null, d: Infinity };
                if (game.food && typeof game.food.x === 'number') {
                    const dx = game.food.x - head.x;
                    const dy = game.food.y - head.y;
                    best = { type: 'food', x: game.food.x, y: game.food.y, d: Math.sqrt(dx*dx + dy*dy) };
                }
                for (const p of game.powerUps) {
                    const dx = p.x - head.x;
                    const dy = p.y - head.y;
                    const d = Math.sqrt(dx*dx + dy*dy);
                    if (d < best.d - 0.001) {
                        best = { type: 'powerup', x: p.x, y: p.y, d };
                    } else if (best.type === 'powerup' && Math.abs(d - best.d) < 0.001) {
                        // keep existing
                    }
                }
                const maxRange = game.headFocusRange || 12;
                if (best.type && best.d <= maxRange) {
                    game.focusTarget = { x: best.x, y: best.y, type: best.type };
                } else {
                    game.focusTarget = null;
                }
            }
        } catch (e) {
            game.focusTarget = null;
        }

        // Choose glow color: if immunity overlay present, use overlay colors for glow
        const glowColor = game.immunityOverlay
            ? (game.currentGlowIntensity > 0.5 ? game.immunityOverlay.strong : game.immunityOverlay.subtle)
            : (game.currentGlowIntensity > 0.5 ? game.snakeGlowStrongColor : game.snakeGlowSubtle);

    // Reduce overall glow blur when immunity overlay is active to keep effect subtle
    const glowBlur = game.immunityOverlay ? (8 + (game.currentGlowIntensity * 6)) : (15 + (game.currentGlowIntensity * 10));

        // Pass glowColor/blur to drawSnake so it can apply glow only to body segments (head excluded)
        drawSnake(game, alpha, isMobile, currentTime, glowColor, glowBlur);

        // Ensure no lingering shadow on the context
        C.ctx.shadowBlur = 0;
        C.ctx.shadowColor = 'transparent';

    // Draw particles on the FX canvas so they appear above the main canvas
    updateAndDrawParticles(C.fxCtx);

        updateAndDrawAnimations(game);
    }

    if (game.isGameOver) {
        C.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        C.ctx.fillRect(0, 0, C.canvas.width, C.canvas.height);
        C.ctx.fillStyle = '#fff';
        C.ctx.font = '48px "Pixelify Sans"';
        C.ctx.textAlign = 'center';
        C.ctx.fillText('GAME OVER', C.canvas.width / 2, C.canvas.height / 2);
    }
}

// drawPowerUp/drawFx implementations moved to js/core/rendering/powerup.js and js/core/rendering/fx.js

export function drawCountdown(game, number) {
    C.ctx.clearRect(0, 0, C.canvas.width, C.canvas.height);
    draw(game);
    C.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    C.ctx.fillRect(0, 0, C.canvas.width, C.canvas.height);
    C.ctx.fillStyle = '#fff';
    C.ctx.font = 'bold 96px sans-serif';
    C.ctx.textAlign = 'center';
    C.ctx.textBaseline = 'middle';
    C.ctx.fillText(number, C.canvas.width / 2, C.canvas.height / 2);
}