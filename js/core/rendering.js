import * as C from '../config/constants.js';
import * as U from '../utils/utils.js';
import { settings } from '../features/settings.js';
import { updateAndDrawParticles } from '../fx/particles.js';
import { updateAndDrawAnimations } from '../fx/animationManager.js';

function drawSnake(game, alpha, isMobile, currentTime) {
    const interpolatedSnake = game.snake.map((seg, i) => {
        let interpolatedX = seg.x * game.cellSize;
        let interpolatedY = seg.y * game.cellSize;

        if (game.prevSnake[i]) {
            const dx = seg.x - game.prevSnake[i].x;
            const dy = seg.y - game.prevSnake[i].y;

            if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
                interpolatedX = (game.prevSnake[i].x + dx * alpha) * game.cellSize;
                interpolatedY = (game.prevSnake[i].y + dy * alpha) * game.cellSize;
            }
        }
        return { x: interpolatedX, y: interpolatedY };
    });

    const activePowerUp = game.activePowerUp ? game.activePowerUp.type : null;

    interpolatedSnake.forEach((seg, i) => {
        const gridX = seg.x / game.cellSize;
        const gridY = seg.y / game.cellSize;
        const isHead = i === 0;

        let color = isHead ? game.snakeHeadColor : game.snakeBodyColor;

        C.ctx.save();

        if (activePowerUp) {
            switch (activePowerUp) {
                case 'IMMUNITY':
                    const borderWidth = 2;
                    C.ctx.fillStyle = color;
                    C.ctx.fillRect(seg.x, seg.y, game.cellSize, game.cellSize);
                    const innerSize = game.cellSize - borderWidth * 2;
                    const gradient = C.ctx.createRadialGradient(
                        seg.x + game.cellSize / 2, seg.y + game.cellSize / 2, 0,
                        seg.x + game.cellSize / 2, seg.y + game.cellSize / 2, game.cellSize / 2
                    );
                    gradient.addColorStop(0, '#4a0e6c');
                    gradient.addColorStop(1, '#000000');
                    color = gradient;
                    break;
                case 'DOUBLE_POINTS':
                    const pulse = Math.sin(currentTime / 150) * 0.5 + 0.5;
                    const color1 = '#FFD700';
                    const color2 = '#FFA500';
                    color = pulse > 0.5 ? color1 : color2;
                    C.ctx.shadowColor = '#FFFFFF';
                    C.ctx.shadowBlur = 10 * pulse;
                    break;
                case 'SLOW_DOWN':
                    color = '#00BFFF';
                    const wave = Math.sin(currentTime / 200 + i / 3) * (game.cellSize / 12);
                    C.ctx.translate(wave, wave);
                    C.ctx.shadowColor = '#FFFFFF';
                    C.ctx.shadowBlur = 5;
                    break;
            }
        }

        drawCell(game, gridX, gridY, color, isMobile, isHead ? game.dir : null, isHead ? game.expression : 'normal');
        
        C.ctx.restore();
    });
}

export function drawCell(game, x, y, color, isMobile, direction = null, expression = 'normal') {
    const px = x * game.cellSize;
    const py = y * game.cellSize;
    const size = game.cellSize;
    const radius = size / 4;

    C.ctx.fillStyle = color;

    if (direction) { // Es la cabeza de la serpiente
        C.ctx.beginPath();

        if (direction.x === 1) { // Derecha
            C.ctx.moveTo(px, py);
            C.ctx.lineTo(px + size - radius, py);
            C.ctx.arcTo(px + size, py, px + size, py + radius, radius);
            C.ctx.lineTo(px + size, py + size - radius);
            C.ctx.arcTo(px + size, py + size, px + size - radius, py + size, radius);
            C.ctx.lineTo(px, py + size);
        } else if (direction.x === -1) { // Izquierda
            C.ctx.moveTo(px + size, py);
            C.ctx.lineTo(px + radius, py);
            C.ctx.arcTo(px, py, px, py + radius, radius);
            C.ctx.lineTo(px, py + size - radius);
            C.ctx.arcTo(px, py + size, px + radius, py + size, radius);
            C.ctx.lineTo(px + size, py + size);
        } else if (direction.y === 1) { // Abajo
            C.ctx.moveTo(px, py);
            C.ctx.lineTo(px + size, py);
            C.ctx.lineTo(px + size, py + size - radius);
            C.ctx.arcTo(px + size, py + size, px + size - radius, py + size, radius);
            C.ctx.lineTo(px + radius, py + size);
            C.ctx.arcTo(px, py + size, px, py + size - radius, radius);
        } else if (direction.y === -1) { // Arriba
            C.ctx.moveTo(px, py + size);
            C.ctx.lineTo(px + size, py + size);
            C.ctx.lineTo(px + size, py + radius);
            C.ctx.arcTo(px + size, py, px + size - radius, py, radius);
            C.ctx.lineTo(px + radius, py);
            C.ctx.arcTo(px, py, px, py + radius, radius);
        }
        C.ctx.closePath();
        C.ctx.fill();

        const eyeSize = size / 5;
        let eye1, eye2;

        if (direction.x !== 0) { // Movimiento horizontal
            eye1 = { x: px + size / 2, y: py + size / 4 };
            eye2 = { x: px + size / 2, y: py + size * 3 / 4 };
        } else { // Movimiento vertical
            eye1 = { x: px + size / 4, y: py + size / 2 };
            eye2 = { x: px + size * 3 / 4, y: py + size / 2 };
        }

        C.ctx.fillStyle = 'white';
        C.ctx.strokeStyle = 'black';
        C.ctx.lineWidth = 1;

        switch (expression) {
            case 'blink':
                const blinkWidth = eyeSize * 1.2;
                C.ctx.beginPath();
                C.ctx.moveTo(eye1.x - blinkWidth / 2, eye1.y);
                C.ctx.lineTo(eye1.x + blinkWidth / 2, eye1.y);
                C.ctx.stroke();
                C.ctx.beginPath();
                C.ctx.moveTo(eye2.x - blinkWidth / 2, eye2.y);
                C.ctx.lineTo(eye2.x + blinkWidth / 2, eye2.y);
                C.ctx.stroke();
                break;

            case 'aggressive':
                C.ctx.fillStyle = '#FFD700';
                C.ctx.beginPath();
                C.ctx.moveTo(eye1.x - eyeSize / 2, eye1.y + eyeSize / 2);
                C.ctx.lineTo(eye1.x + eyeSize / 2, eye1.y - eyeSize / 2);
                C.ctx.stroke();
                C.ctx.beginPath();
                C.ctx.moveTo(eye2.x - eyeSize / 2, eye2.y + eyeSize / 2);
                C.ctx.lineTo(eye2.x + eyeSize / 2, eye2.y - eyeSize / 2);
                C.ctx.stroke();
                break;

            case 'relaxed':
                C.ctx.beginPath();
                C.ctx.arc(eye1.x, eye1.y + eyeSize / 3, eyeSize / 2, Math.PI, 2 * Math.PI);
                C.ctx.stroke();
                C.ctx.beginPath();
                C.ctx.arc(eye2.x, eye2.y + eyeSize / 3, eyeSize / 2, Math.PI, 2 * Math.PI);
                C.ctx.stroke();
                break;

            case 'surprised':
                C.ctx.beginPath();
                C.ctx.arc(eye1.x, eye1.y, eyeSize / 1.5, 0, 2 * Math.PI);
                C.ctx.fill();
                C.ctx.stroke();
                C.ctx.beginPath();
                C.ctx.arc(eye2.x, eye2.y, eyeSize / 1.5, 0, 2 * Math.PI);
                C.ctx.fill();
                C.ctx.stroke();
                break;

            case 'focused':
                C.ctx.fillRect(eye1.x - eyeSize/2, eye1.y - eyeSize/4, eyeSize, eyeSize/2);
                C.ctx.fillRect(eye2.x - eyeSize/2, eye2.y - eyeSize/4, eyeSize, eyeSize/2);
                break;

            case 'normal':
            default:
                const pupilSize = eyeSize / 2;
                C.ctx.fillRect(eye1.x - eyeSize / 2, eye1.y - eyeSize / 2, eyeSize, eyeSize);
                C.ctx.fillRect(eye2.x - eyeSize / 2, eye2.y - eyeSize / 2, eyeSize, eyeSize);
                C.ctx.fillStyle = 'black';
                C.ctx.fillRect(eye1.x - pupilSize / 2, eye1.y - pupilSize / 2, pupilSize, pupilSize);
                C.ctx.fillRect(eye2.x - pupilSize / 2, eye2.y - pupilSize / 2, pupilSize, pupilSize);
                break;
        }

    } else {
        let scale = 1;
        if (color === game.foodColor) {
            const elapsed = Date.now() - game.foodSpawnTime;
            const duration = 200;
            let progress = Math.min(1, elapsed / duration);
            progress = progress * (2 - progress);
            scale = 0.5 + (progress * 0.5);
        }
        C.ctx.fillRect(px + (size * (1 - scale) / 2), py + (size * (1 - scale) / 2), size * scale, size * scale);
    }
}

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
                    drawCell(game, obstacle.x + xOffset / game.cellSize, obstacle.y + yOffset / game.cellSize, game.obstacleColor, isMobile);
                });

                C.ctx.globalAlpha = progress;
                game.obstacles.forEach(obstacle => {
                    const xOffset = (Math.random() - 0.5) * (1 - progress) * 20;
                    const yOffset = (Math.random() - 0.5) * (1 - progress) * 20;
                    drawCell(game, obstacle.x + xOffset / game.cellSize, obstacle.y + yOffset / game.cellSize, game.obstacleColor, isMobile);
                });

                C.ctx.globalAlpha = 1;
            } else {
                C.ctx.shadowColor = game.obstacleColor;
                C.ctx.shadowBlur = 5 + (game.obstacleGlowProgress * 15);

                game.obstacles.forEach(obstacle => {
                    drawCell(game, obstacle.x, obstacle.y, game.obstacleColor, isMobile);
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
            drawCell(game, game.food.x, game.food.y, game.foodColor, isMobile);
        }

        let alpha = 1;
        if (game.running && game.prevSnake.length > 0) {
            alpha = (currentTime - game.lastTickTime) / game.tickMs;
            if (alpha > 1) alpha = 1;
        }

        const glowColor = game.currentGlowIntensity > 0.5 ? game.snakeGlowStrongColor : game.snakeGlowSubtle;
        C.ctx.shadowColor = glowColor;
        C.ctx.shadowBlur = 15 + (game.currentGlowIntensity * 10);

        drawSnake(game, alpha, isMobile, currentTime);
        
        C.ctx.shadowBlur = 0;
        C.ctx.shadowColor = 'transparent';

        updateAndDrawParticles(C.ctx);

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

function drawPowerUp(game, powerUp) {
    const px = powerUp.x * game.cellSize;
    const py = powerUp.y * game.cellSize;
    const size = game.cellSize * 1.3;
    const half = size / 2;
    const ctx = C.ctx;

    ctx.fillStyle = powerUp.color;
    ctx.strokeStyle = powerUp.color;
    ctx.lineWidth = 2;

    const centerX = px + game.cellSize / 2;
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