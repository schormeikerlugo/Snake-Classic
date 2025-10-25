import * as C from '../../config/constants.js';

export function drawCell(game, x, y, color, isMobile, direction = null, expression = 'normal', focusTarget = null, isSnakeSegment = false) {
    const px = x * game.cellSize;
    const py = y * game.cellSize;
    const size = game.cellSize;
    const radius = size / 4;

    // Default fill style uses the supplied color value. We'll override for head and body gradients.
    C.ctx.fillStyle = color;

    if (direction) { // Es la cabeza de la serpiente
        // Head should use the provided color (game.snakeHeadColor) — restore original behavior
        C.ctx.fillStyle = color;
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

        // Calculate smart pupil offsets toward focusTarget if provided
        let focusOffset = { x: 0, y: 0 };
        if (focusTarget && typeof focusTarget.x === 'number') {
            // Convert focus target grid coords to pixel center
            const targetPx = (focusTarget.x + 0.5) * game.cellSize;
            const targetPy = (focusTarget.y + 0.5) * game.cellSize;
            // Eye center average for head
            const eyeCenterX = (eye1 ? (eye1.x + eye2.x) / 2 : px + size / 2);
            const eyeCenterY = (eye1 ? (eye1.y + eye2.y) / 2 : py + size / 2);
            const dx = targetPx - eyeCenterX;
            const dy = targetPy - eyeCenterY;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            // Limit offset to a fraction of eyeSize
            const maxOff = eyeSize * 0.35;
            focusOffset.x = (dx / dist) * maxOff;
            focusOffset.y = (dy / dist) * maxOff;
        }

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
                C.ctx.fillRect(eye1.x - eyeSize/2 + focusOffset.x, eye1.y - eyeSize/4 + focusOffset.y, eyeSize, eyeSize/2);
                C.ctx.fillRect(eye2.x - eyeSize/2 + focusOffset.x, eye2.y - eyeSize/4 + focusOffset.y, eyeSize, eyeSize/2);
                break;

            case 'normal':
            default:
                const pupilSize = eyeSize / 2;
                // Apply focus offset to pupils
                C.ctx.fillRect(eye1.x - eyeSize / 2 + focusOffset.x, eye1.y - eyeSize / 2 + focusOffset.y, eyeSize, eyeSize);
                C.ctx.fillRect(eye2.x - eyeSize / 2 + focusOffset.x, eye2.y - eyeSize / 2 + focusOffset.y, eyeSize, eyeSize);
                C.ctx.fillStyle = 'black';
                C.ctx.fillRect(eye1.x - pupilSize / 2 + focusOffset.x, eye1.y - pupilSize / 2 + focusOffset.y, pupilSize, pupilSize);
                C.ctx.fillRect(eye2.x - pupilSize / 2 + focusOffset.x, eye2.y - pupilSize / 2 + focusOffset.y, pupilSize, pupilSize);
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

    // If this is a snake body segment and IMMUNITY is active, draw an inner linear gradient
        // that subtly moves (only the gradient position shifts over time) from black -> #30093D.
        if (isSnakeSegment && game.activePowerUp && game.activePowerUp.type === 'IMMUNITY') {
            const borderWidth = 2;
            // Outer border in snake color (keeps silhouette)
            C.ctx.fillStyle = game.snakeBodyColor || '#070414';
            C.ctx.fillRect(px, py, size, size);

            const innerSize = size - borderWidth * 2;

            // small linear shift for the gradient to create movement but cheap
            const t2 = Date.now() / 1000; // seconds
            const seed2 = (((Math.floor(px) * 374761393) ^ (Math.floor(py) * 668265263)) >>> 0) & 0xffffffff;
            const shift = Math.sin(t2 * 0.8 + (seed2 % 13)) * (size * 0.15);

            // Linear gradient that moves along the X axis inside the cell
            const lg = C.ctx.createLinearGradient(px + borderWidth + shift, py + borderWidth, px + borderWidth + innerSize + shift, py + borderWidth + innerSize);
            // Dominant black center toward the start of gradient, blending into #30093D
            lg.addColorStop(0, '#000000');
            lg.addColorStop(0.6, '#000000');
            // Use #30093D at 30% opacity as requested for the IMMUNITY interior tint
            lg.addColorStop(1, 'rgba(48,9,61,0.30)');

            C.ctx.fillStyle = lg;
            C.ctx.fillRect(px + borderWidth, py + borderWidth, innerSize, innerSize);
        } else {
            // Default body drawing: use the provided color or, if this is a snake segment,
            // draw the requested base gradient between #070414 -> #30093D.
            if (isSnakeSegment) {
                // Restore base body drawing to use provided color (game.snakeBodyColor)
                C.ctx.fillStyle = color;
                C.ctx.fillRect(px + (size * (1 - scale) / 2), py + (size * (1 - scale) / 2), size * scale, size * scale);
            } else {
                C.ctx.fillStyle = color;
                C.ctx.fillRect(px + (size * (1 - scale) / 2), py + (size * (1 - scale) / 2), size * scale, size * scale);
            }
        }
    }
}
