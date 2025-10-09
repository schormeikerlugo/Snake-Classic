import * as C from '../config/constants.js';
import * as U from '../utils/utils.js';
import { settings } from '../features/settings.js';
import { updateAndDrawParticles } from '../fx/particles.js';

export function drawCell(game, x, y, color, isMobile) {
    const px = x * game.cellSize;
    const py = y * game.cellSize;

    // Food animation
    let scale = 1;
    if (color === game.foodColor) {
        const elapsed = Date.now() - game.foodSpawnTime;
        const duration = 200; // Animation duration in ms (faster)
        let progress = Math.min(1, elapsed / duration);
        // Apply ease-out effect
        progress = progress * (2 - progress); // EaseOutQuad
        scale = 0.5 + (progress * 0.5); // Scale from 0.5 to 1
    }

    C.ctx.fillStyle = color;
    C.ctx.fillRect(px + (game.cellSize * (1 - scale) / 2), py + (game.cellSize * (1 - scale) / 2), game.cellSize * scale, game.cellSize * scale);
}

export function draw(game, currentTime) {
    // console.log('Draw called. isGameOver:', game.isGameOver, 'running:', game.running);
    // Clear canvas only if game is running
    if (game.running) {
        C.ctx.clearRect(0, 0, C.canvas.width, C.canvas.height);
    }

    // Draw game elements only if game is running or paused (not game over)
    if (game.running || game.paused) { // Draw game elements if running or paused
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

        const isMobile = window.innerWidth <= 768; // Determine isMobile here

        // Draw obstacles
        if (settings.obstacles) {
            if (game.isGlitching) {
                const glitchDuration = 500;
                const elapsed = Date.now() - game.glitchStartTime;
                const progress = Math.min(1, elapsed / glitchDuration);

                // Dibujar obstáculos viejos "glitcheando"
                C.ctx.globalAlpha = 1 - progress; // Desvanecer
                game.oldObstacles.forEach(obstacle => {
                    const xOffset = (Math.random() - 0.5) * 15;
                    const yOffset = (Math.random() - 0.5) * 15;
                    drawCell(game, obstacle.x + xOffset / game.cellSize, obstacle.y + yOffset / game.cellSize, game.obstacleColor, isMobile);
                });

                // Dibujar obstáculos nuevos "apareciendo"
                C.ctx.globalAlpha = progress; // Aparecer
                game.obstacles.forEach(obstacle => {
                    const xOffset = (Math.random() - 0.5) * (1 - progress) * 20;
                    const yOffset = (Math.random() - 0.5) * (1 - progress) * 20;
                    drawCell(game, obstacle.x + xOffset / game.cellSize, obstacle.y + yOffset / game.cellSize, game.obstacleColor, isMobile);
                });

                C.ctx.globalAlpha = 1; // Restablecer alpha
            } else {
                // Dibujado normal con pulso de neón
                C.ctx.shadowColor = game.obstacleColor;
                C.ctx.shadowBlur = 5 + (game.obstacleGlowProgress * 15); // Pulso de 5 a 20

                game.obstacles.forEach(obstacle => {
                    drawCell(game, obstacle.x, obstacle.y, game.obstacleColor, isMobile);
                });
                
                C.ctx.shadowBlur = 0;
                C.ctx.shadowColor = 'transparent';
            }
        }

        // Draw power-ups
        game.powerUps.forEach(p => {
            C.ctx.shadowColor = p.color;
            C.ctx.shadowBlur = 5 + (game.powerUpGlowProgress * 15); // Faster pulse
            drawPowerUp(game, p);
        });
        C.ctx.shadowBlur = 0;
        C.ctx.shadowColor = 'transparent';

        if (game.food.x !== undefined) { // Only draw food if defined
            drawCell(game, game.food.x, game.food.y, game.foodColor, isMobile); // Pass isMobile
        }

        // Interpolate snake position
        let alpha = 1; // Default to 1 if not running or first frame
        if (game.running && game.prevSnake.length > 0) {
            alpha = (currentTime - game.lastTickTime) / game.tickMs;
            if (alpha > 1) alpha = 1; // Cap alpha at 1
        }

        // --- Glow and Snake Drawing ---
        const glowColor = game.currentGlowIntensity > 0.5 ? game.snakeGlowStrongColor : game.snakeGlowSubtle;
        C.ctx.shadowColor = glowColor;
        C.ctx.shadowBlur = 15 + (game.currentGlowIntensity * 10);

        game.snake.forEach((seg, i) => {
            let interpolatedX = seg.x;
            let interpolatedY = seg.y;

            if (game.prevSnake[i]) { // Ensure previous segment exists
                const dx = seg.x - game.prevSnake[i].x;
                const dy = seg.y - game.prevSnake[i].y;

                // Si la serpiente se teletransporta (salta más de 1 celda), no interpolar
                if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
                    interpolatedX = seg.x;
                    interpolatedY = seg.y;
                } else {
                    interpolatedX = game.prevSnake[i].x + dx * alpha;
                    interpolatedY = game.prevSnake[i].y + dy * alpha;
                }
            }

            drawCell(game, interpolatedX, interpolatedY, i === 0 ? game.snakeHeadColor : game.snakeBodyColor, isMobile); // Pass isMobile
        });
        
        C.ctx.shadowBlur = 0;
        C.ctx.shadowColor = 'transparent';
        // --- End Glow and Snake Drawing ---

        // --- Particle Effects ---
        updateAndDrawParticles(C.ctx);

    }

    // If game is over, draw game over screen (always drawn last)
    if (game.isGameOver) {
        // console.log('Drawing game over screen. Scanner progress:', game.scannerProgress);
        C.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'; // Red semi-transparent overlay (more transparent)
        C.ctx.fillRect(0, 0, C.canvas.width, C.canvas.height);
        C.ctx.fillStyle = '#fff';
        C.ctx.font = '48px "Pixelify Sans"';
        C.ctx.textAlign = 'center';
        C.ctx.fillText('GAME OVER', C.canvas.width / 2, C.canvas.height / 2);
    }
}

function drawPowerUp(game, powerUp) {
    const px = powerUp.x * game.cellSize;
    const py = powerUp.y * game.cellSize;
    const size = game.cellSize * 1.3; // 30% larger
    const half = size / 2;
    const ctx = C.ctx;

    ctx.fillStyle = powerUp.color;
    ctx.strokeStyle = powerUp.color;
    ctx.lineWidth = 2;

    const centerX = px + game.cellSize / 2; // Center based on original cell size
    const centerY = py + game.cellSize / 2;

    switch (powerUp.shape) {
        case 'triangle':
            ctx.beginPath();
            ctx.moveTo(centerX, centerY - half * 0.5);
            ctx.lineTo(centerX + half * 0.5, centerY + half * 0.5);
            ctx.lineTo(centerX - half * 0.5, centerY + half * 0.5);
            ctx.closePath();
            ctx.fill();
            break;
        case 'quadrilateral':
            ctx.fillRect(centerX - half, centerY - half * 0.7, size, size * 0.7);
            break;
        case 'hexagon':
            ctx.beginPath();
            ctx.moveTo(centerX + half, centerY);
            for (let i = 1; i <= 6; i++) {
                ctx.lineTo(centerX + half * Math.cos(i * 2 * Math.PI / 6), centerY + half * Math.sin(i * 2 * Math.PI / 6));
            }
            ctx.closePath();
            ctx.fill();
            break;
        case 'circle':
            ctx.beginPath();
            ctx.arc(centerX, centerY, half, 0, 2 * Math.PI);
            ctx.fill();
            break;
        case 'star':
            drawStar(ctx, centerX, centerY, 5, half, half / 2);
            ctx.fill();
            break;
        case 'square':
        default:
            ctx.fillRect(centerX - half, centerY - half, size, size);
            break;
    }
}

function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
}


export function drawFx(game, ts) {
    C.fxCtx.clearRect(0, 0, C.fxCanvas.width, C.fxCanvas.height);
    const dt = (ts - game.lastFxTs) / 1000;
    game.lastFxTs = ts;
    for (let i = game.effects.length - 1; i >= 0; i--) {
        const fx = game.effects[i];
        fx.r += 60 * dt;
        fx.alpha -= 1.5 * dt;
        if (fx.alpha <= 0) {
            game.effects.splice(i, 1);
            continue;
        }
        C.fxCtx.beginPath();
        C.fxCtx.arc(fx.x, fx.y, fx.r, 0, Math.PI * 2);
        C.fxCtx.strokeStyle = `rgba(255,255,255,${fx.alpha})`;
        C.fxCtx.stroke();
    }
    requestAnimationFrame(ts => drawFx(game, ts));
}

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
