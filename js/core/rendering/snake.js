import * as C from '../../config/constants.js';
import { drawCell } from './cell.js';

export function drawSnake(game, alpha, isMobile, currentTime, glowColor = null, glowBlur = 0) {
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
        // compute base color per-segment
        let color = isHead ? game.snakeHeadColor : game.snakeBodyColor;

        // Save context so per-segment transforms/shadows don't leak
        C.ctx.save();

        // Default shadow for body segments (global glow) — overridden by power-up visuals below
        if (!isHead && glowColor) {
            C.ctx.shadowColor = glowColor;
            C.ctx.shadowBlur = glowBlur;
        } else {
            C.ctx.shadowBlur = 0;
            C.ctx.shadowColor = 'transparent';
        }

        // Apply active power-up visuals per legacy behavior
        if (activePowerUp) {
            switch (activePowerUp) {
                case 'IMMUNITY':
                    // For immunity we keep the base body color but let drawCell render
                    // the inner radial gradient (black -> snake color) per-segment. Head forced to normal.
                    if (isHead) {
                        // ensure head looks normal during immunity
                        // no extra changes here; drawCell will respect expression
                    } else {
                        // Keep color as snake body color; drawCell will detect immunity and draw gradient
                    }
                    break;

                case 'DOUBLE_POINTS':
                    // Pulse between two golden hues and add a white glow
                    const pulse = Math.sin(currentTime / 150) * 0.5 + 0.5;
                    const color1 = '#FFD700';
                    const color2 = '#FFA500';
                    color = pulse > 0.5 ? color1 : color2;
                    C.ctx.shadowColor = '#FFFFFF';
                    C.ctx.shadowBlur = 10 * pulse;
                    break;

                case 'SLOW_DOWN':
                    // Slight wave offset and subtle white shadow
                    color = '#00BFFF';
                    const wave = Math.sin(currentTime / 200 + i / 3) * (game.cellSize / 12);
                    C.ctx.translate(wave, wave);
                    C.ctx.shadowColor = '#FFFFFF';
                    C.ctx.shadowBlur = 5;
                    break;
            }
        }

        // Determine expression for head (same priority rules as before)
        let headExpression = game.expression;
        if (isHead) {
            if (game.expression === 'blink') {
                headExpression = 'blink';
            } else if (game.headBlinkActive && !game.isImmune) {
                headExpression = 'blink';
            } else if (activePowerUp === 'IMMUNITY' && isHead) {
                headExpression = 'normal';
            } else {
                headExpression = game.expression;
            }
        }

        drawCell(
            game,
            gridX,
            gridY,
            color,
            isMobile,
            isHead ? game.dir : null,
            isHead ? headExpression : 'normal',
            isHead ? game.focusTarget : null,
            !isHead // isSnakeSegment: true for body segments
        );

        C.ctx.restore();
    });
}
