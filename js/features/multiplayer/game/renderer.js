/**
 * @file renderer.js
 * @description Renderizador del juego multiplayer
 */

export class MultiplayerRenderer {
    constructor(canvas, arena) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.arena = arena;

        // Configurar tamaño
        this.resize();
    }

    /**
     * Redimensionar canvas
     */
    resize() {
        const size = Math.min(window.innerWidth * 0.8, 600);
        this.canvas.width = size;
        this.canvas.height = size;

        this.cellSize = size / this.arena.cols;
    }

    /**
     * Dibujar el juego
     */
    draw() {
        const ctx = this.ctx;
        const cellSize = this.cellSize;

        // Limpiar
        ctx.fillStyle = '#0d1020';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Dibujar grid
        this.drawGrid();

        // Dibujar comida
        if (this.arena.food) {
            this.drawFood(this.arena.food);
        }

        // Dibujar serpientes
        for (const player of Object.values(this.arena.players)) {
            if (player.isAlive) {
                this.drawSnake(player);
            }
        }

        // Dibujar HUD (nombres y scores)
        this.drawHUD();
    }

    /**
     * Dibujar grid
     */
    drawGrid() {
        const ctx = this.ctx;
        const cellSize = this.cellSize;

        ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.lineWidth = 0.5;

        for (let x = 0; x <= this.arena.cols; x++) {
            ctx.beginPath();
            ctx.moveTo(x * cellSize, 0);
            ctx.lineTo(x * cellSize, this.canvas.height);
            ctx.stroke();
        }

        for (let y = 0; y <= this.arena.rows; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * cellSize);
            ctx.lineTo(this.canvas.width, y * cellSize);
            ctx.stroke();
        }
    }

    /**
     * Dibujar comida
     */
    drawFood(food) {
        const ctx = this.ctx;
        const cellSize = this.cellSize;
        const x = food.x * cellSize + cellSize / 2;
        const y = food.y * cellSize + cellSize / 2;
        const radius = cellSize * 0.4;

        // Brillo
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, '#FF0000');
        gradient.addColorStop(0.7, '#AA0000');
        gradient.addColorStop(1, '#550000');

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Glow
        ctx.shadowColor = '#FF0000';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    /**
     * Dibujar serpiente
     */
    drawSnake(player) {
        const ctx = this.ctx;
        const cellSize = this.cellSize;

        player.snake.forEach((segment, index) => {
            const x = segment.x * cellSize;
            const y = segment.y * cellSize;
            const isHead = index === 0;

            // Color con gradiente
            const alpha = 1 - (index / player.snake.length) * 0.5;
            ctx.fillStyle = this.adjustAlpha(player.color, alpha);

            if (isHead) {
                // Cabeza más grande y redondeada
                this.drawRoundedRect(x + 1, y + 1, cellSize - 2, cellSize - 2, 4);
                ctx.fill();

                // Ojos
                this.drawEyes(x, y, cellSize, player.direction);
            } else {
                // Cuerpo
                this.drawRoundedRect(x + 2, y + 2, cellSize - 4, cellSize - 4, 3);
                ctx.fill();
            }
        });
    }

    /**
     * Dibujar ojos de la serpiente
     */
    drawEyes(x, y, cellSize, direction) {
        const ctx = this.ctx;
        const eyeSize = cellSize * 0.15;
        const offset = cellSize * 0.25;

        ctx.fillStyle = '#FFFFFF';

        let eye1, eye2;

        switch (direction) {
            case 'right':
                eye1 = { x: x + cellSize - offset, y: y + offset };
                eye2 = { x: x + cellSize - offset, y: y + cellSize - offset };
                break;
            case 'left':
                eye1 = { x: x + offset, y: y + offset };
                eye2 = { x: x + offset, y: y + cellSize - offset };
                break;
            case 'up':
                eye1 = { x: x + offset, y: y + offset };
                eye2 = { x: x + cellSize - offset, y: y + offset };
                break;
            case 'down':
                eye1 = { x: x + offset, y: y + cellSize - offset };
                eye2 = { x: x + cellSize - offset, y: y + cellSize - offset };
                break;
        }

        ctx.beginPath();
        ctx.arc(eye1.x, eye1.y, eyeSize, 0, Math.PI * 2);
        ctx.arc(eye2.x, eye2.y, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // Pupilas
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(eye1.x, eye1.y, eyeSize * 0.5, 0, Math.PI * 2);
        ctx.arc(eye2.x, eye2.y, eyeSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Dibujar HUD con nombres y scores
     */
    drawHUD() {
        const ctx = this.ctx;
        const players = Object.values(this.arena.players);

        ctx.font = 'bold 14px "Press Start 2P", monospace';
        ctx.textAlign = 'left';

        let y = 20;

        players.forEach((player, index) => {
            const x = index === 0 ? 10 : this.canvas.width - 150;

            // Nombre
            ctx.fillStyle = player.color;
            ctx.fillText(player.name.slice(0, 10), x, y);

            // Score
            ctx.fillStyle = player.isAlive ? '#FFFFFF' : '#666666';
            ctx.fillText(`Score: ${player.score}`, x, y + 18);

            // Indicador de victoria (rondas)
            if (this.arena.mode === 'duel') {
                ctx.fillText(`Wins: ${player.roundWins}`, x, y + 36);
            }
        });
    }

    /**
     * Dibujar pantalla de Game Over
     */
    drawGameOver(result) {
        const ctx = this.ctx;

        // Overlay oscuro
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Texto
        ctx.font = 'bold 24px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#00FFFF';
        ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);

        ctx.font = 'bold 16px "Press Start 2P", monospace';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`Ganador: ${result.winnerName}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
    }

    // Helpers

    drawRoundedRect(x, y, width, height, radius) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    adjustAlpha(color, alpha) {
        // Convertir hex a rgba
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}
