import * as U from '../../utils/utils.js';
import { inObstacle } from './obstacles.js';

export function placeFood(game) {
    let tries = 0;
    while (true) {
        const c = { x: U.randInt(0, game.cols - 1), y: U.randInt(0, game.rows - 1) };
        if (!game.inSnake(c) && !inObstacle(game, c)) {
            game.food = c;
            game.foodSpawnTime = Date.now();
            return;
        }
        if (++tries > 2000) {
            game.gameOver(true);
            return;
        }
    }
}
