import * as C from '../../config/constants.js';
import * as U from '../../utils/utils.js';
import { settings } from '../../features/settings.js';

export function changeAndAnimateObstacles(game) {
    game.paused = true;
    game.isGlitching = true;
    game.glitchStartTime = Date.now();
    game.oldObstacles = [...game.obstacles]; // Guardar estado anterior

    C.canvas.classList.add('glitch-effect'); // Aplicar efecto al canvas

    generateObstacles(game, true); // Generar nuevos obstáculos inmediatamente

    const glitchDuration = 500; // Duración del efecto en ms

    setTimeout(() => {
        game.isGlitching = false;
        game.oldObstacles = [];
        if (game.running) {
            game.paused = false;
        }
        C.canvas.classList.remove('glitch-effect'); // Quitar efecto del canvas
    }, glitchDuration);
}

export function generateObstacles(game, isDynamic = false) {
    game.obstacles = [];

    // For dynamic changes, generate random obstacles
    if (isDynamic && settings.obstacles) {
        const numObstacles = U.randInt(3, 6); // Generate 3 to 6 obstacle clusters
        for (let i = 0; i < numObstacles; i++) {
            const obstacleWidth = U.randInt(1, 4); // Width from 1 to 3
            const obstacleHeight = U.randInt(1, 4); // Height from 1 to 3
            
            // Ensure obstacles don't spawn too close to the edges
            const startX = U.randInt(2, game.cols - 2 - obstacleWidth);
            const startY = U.randInt(2, game.rows - 2 - obstacleHeight);

            for (let w = 0; w < obstacleWidth; w++) {
                for (let h = 0; h < obstacleHeight; h++) {
                    const pos = { x: startX + w, y: startY + h };
                    // Avoid placing on snake, other obstacles, or too close to the snake head
                    if (!game.inSnake(pos) && !inObstacle(game, pos) && (Math.abs(pos.x - game.snake[0].x) > 3 || Math.abs(pos.y - game.snake[0].y) > 3)) {
                        game.obstacles.push(pos);
                    }
                }
            }
        }
    } else if (settings.obstacles) {
        // Original static obstacles for the start of the game
        const center_x = Math.floor(game.cols / 2);
        const center_y = Math.floor(game.rows / 2);
        for (let i = 0; i < 8; i++) {
            game.obstacles.push({ x: center_x - 5, y: center_y - 4 + i });
            game.obstacles.push({ x: center_x + 5, y: center_y - 4 + i });
        }
    }
}

export function inObstacle(game, pos) {
    return game.obstacles.some(obstacle => U.posEq(obstacle, pos));
}
