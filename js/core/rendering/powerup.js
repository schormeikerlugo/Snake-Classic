import * as C from '../../config/constants.js';

export function drawPowerUp(game, powerUp) {
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
