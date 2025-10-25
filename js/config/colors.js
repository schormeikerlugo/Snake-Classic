import * as U from '../utils/utils.js';

export const COLORS = [
    { base: '#0084FF', head: '#66B5FF' }, // Azul
    { base: '#EA13A2', head: '#F56CD1' }, // Rosa
    { base: '#F6E844', head: '#F9F07E' }, // Amarillo
    { base: '#F6AC44', head: '#F9C67E' }, // Naranja
    { base: '#f10c0cff', head: '#e73b3bff' }, // Rojo
    // Nuevos colores eléctricos
    { base: '#39FF14', head: '#7FFF00' }, // Verde Neón
    { base: '#00FFFF', head: '#E0FFFF' }, // Cian
    { base: '#9400D3', head: '#BF00FF' }, // Púrpura Eléctrico
    { base: '#FF00FF', head: '#FF77FF' }, // Magenta Vívido
    { base: '#FF5F1F', head: '#FF8C00' }  // Naranja Intenso
];

export const OBSTACLE_COLORS = [
    '#FF5733', // Naranja rojizo
    '#DAF7A6', // Verde pálido
    '#FFC300', // Amarillo dorado
    '#C70039', // Rojo carmesí
    '#900C3F'  // Borgoña
];

let currentColorIndex = -1;
let currentObstacleColorIndex = 0; // Índice para el color de los obstáculos

/**
 * Actualiza el color de la serpiente y su resplandor basado en la puntuación.
 * @param {Game} game - La instancia principal del juego.
 */
export function updateSnakeColor(game) {
    if (game.score === 0) {
        // Restablecer a los colores originales y cachearlos
        const body = '#43d9ad';
        const head = '#6ee7c8';
        const subtle = 'rgba(67, 217, 173, 0.2)';
        const strong = 'rgba(67, 217, 173, 0.6)';
        U.setCssVar('--snake', body);
        U.setCssVar('--snake-head', head);
        U.setCssVar('--snake-glow-subtle', subtle);
        U.setCssVar('--snake-glow-strong', strong);

        game.snakeBodyColor = body;
        game.snakeHeadColor = head;
        game.snakeGlowSubtle = subtle;
        game.snakeGlowStrongColor = strong;

        // If a power-up has stored previous colors to restore later, update that snapshot
        if (game._prevPowerupColors) {
            game._prevPowerupColors.snakeBodyColor = game.snakeBodyColor;
            game._prevPowerupColors.snakeHeadColor = game.snakeHeadColor;
            game._prevPowerupColors.snakeGlowSubtle = game.snakeGlowSubtle;
            game._prevPowerupColors.snakeGlowStrongColor = game.snakeGlowStrongColor;
        }

        currentColorIndex = -1; // Restablecer el índice
        updateObstacleColor(game, true); // Restablecer color de obstáculo
        return;
    }

    // Cambia de color cada 10 puntos
    if (game.score > 0 && game.score % 10 === 0) {
        currentColorIndex = (currentColorIndex + 1) % COLORS.length;
        const newColor = COLORS[currentColorIndex];

        // Convertir el color base a RGB para el resplandor
        const rgb = newColor.base.match(/\w\w/g).map(x => parseInt(x, 16));
        const subtle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.2)`;
        const strong = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.6)`;

        U.setCssVar('--snake', newColor.base);
        U.setCssVar('--snake-head', newColor.head);
        U.setCssVar('--snake-glow-subtle', subtle);
        U.setCssVar('--snake-glow-strong', strong);

        game.snakeBodyColor = newColor.base;
        game.snakeHeadColor = newColor.head;
        game.snakeGlowSubtle = subtle;
        game.snakeGlowStrongColor = strong;
        // If a power-up has stored previous colors to restore later, update that snapshot
        if (game._prevPowerupColors) {
            game._prevPowerupColors.snakeBodyColor = game.snakeBodyColor;
            game._prevPowerupColors.snakeHeadColor = game.snakeHeadColor;
            game._prevPowerupColors.snakeGlowSubtle = game.snakeGlowSubtle;
            game._prevPowerupColors.snakeGlowStrongColor = game.snakeGlowStrongColor;
        }

        updateObstacleColor(game); // Actualizar color de obstáculo
    }
}

/**
 * Actualiza el color de los obstáculos, asegurando que no coincida con el de la serpiente.
 * @param {Game} game - La instancia principal del juego.
 * @param {boolean} [reset=false] - Indica si se debe restablecer al color por defecto.
 */
export function updateObstacleColor(game, reset = false) {
    if (reset) {
        game.obstacleColor = U.getCssVar('--obstacle-color');
        return;
    }

    // Asegurarse de que el color del obstáculo sea diferente al de la serpiente
    let nextColor;
    do {
        currentObstacleColorIndex = (currentObstacleColorIndex + 1) % OBSTACLE_COLORS.length;
        nextColor = OBSTACLE_COLORS[currentObstacleColorIndex];
    } while (nextColor === game.snakeBodyColor);

    game.obstacleColor = nextColor;
}