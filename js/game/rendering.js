import * as C from '../constants.js';
import * as U from '../utils.js';

export function drawCell(game, x, y, color, isMobile) {
    const px = x * game.cellSize;
    const py = y * game.cellSize;

    // Food animation
    let scale = 1;
    if (color === U.getCssVar('--food')) {
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
    console.log('Draw called. isGameOver:', game.isGameOver, 'running:', game.running);
    // Clear canvas only if game is running
    if (game.running) {
        C.ctx.clearRect(0, 0, C.canvas.width, C.canvas.height);
    }

    // Draw game elements only if game is running or paused (not game over)
    if (game.running || game.paused) { // Draw game elements if running or paused
        C.ctx.strokeStyle = U.getCssVar('--grid');
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

        if (game.food.x !== undefined) { // Only draw food if defined
            drawCell(game, game.food.x, game.food.y, U.getCssVar('--food'), isMobile); // Pass isMobile
        }

        // Interpolate snake position
        let alpha = 1; // Default to 1 if not running or first frame
        if (game.running && game.prevSnake.length > 0) {
            alpha = (currentTime - game.lastTickTime) / game.tickMs;
            if (alpha > 1) alpha = 1; // Cap alpha at 1
        }

        // --- Glow and Snake Drawing ---
        const glowColor = game.currentGlowIntensity > 0.5 ? U.getCssVar('--snake-glow-strong') : U.getCssVar('--snake-glow-subtle');
        C.ctx.shadowColor = glowColor;
        C.ctx.shadowBlur = 15 + (game.currentGlowIntensity * 10);

        game.snake.forEach((seg, i) => {
            let interpolatedX = seg.x;
            let interpolatedY = seg.y;

            if (game.prevSnake[i]) { // Ensure previous segment exists
                interpolatedX = game.prevSnake[i].x + (seg.x - game.prevSnake[i].x) * alpha;
                interpolatedY = game.prevSnake[i].y + (seg.y - game.prevSnake[i].y) * alpha;
            }

            drawCell(game, interpolatedX, interpolatedY, i === 0 ? U.getCssVar('--snake-head') : U.getCssVar('--snake'), isMobile); // Pass isMobile
        });
        
        C.ctx.shadowBlur = 0;
        C.ctx.shadowColor = 'transparent';
        // --- End Glow and Snake Drawing ---
    }

    // If game is over, draw game over screen (always drawn last)
    if (game.isGameOver) {
        console.log('Drawing game over screen. Scanner progress:', game.scannerProgress);
        C.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'; // Red semi-transparent overlay (more transparent)
        C.ctx.fillRect(0, 0, C.canvas.width, C.canvas.height);
        C.ctx.fillStyle = '#fff';
        C.ctx.font = '48px "Pixelify Sans"';
        C.ctx.textAlign = 'center';
        C.ctx.fillText('GAME OVER', C.canvas.width / 2, C.canvas.height / 2);
    }
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
    C.ctx.clearRect(0, 0, C.canvas.width, C.canvas.height); // Clear canvas before drawing
    draw(game); // Draw game state first
    C.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    C.ctx.fillRect(0, 0, C.canvas.width, C.canvas.height);
    C.ctx.fillStyle = '#fff';
    C.ctx.font = 'bold 96px sans-serif';
    C.ctx.textAlign = 'center';
    C.ctx.textBaseline = 'middle';
    C.ctx.fillText(number, C.canvas.width / 2, C.canvas.height / 2);
}