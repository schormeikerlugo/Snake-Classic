
import * as U from './utils.js';

const COLORS = [
    { base: '#0084FF', head: '#66B5FF' }, // Azul
    { base: '#EA13A2', head: '#F56CD1' }, // Rosa
    { base: '#F6E844', head: '#F9F07E' }, // Amarillo
    { base: '#F6AC44', head: '#F9C67E' }, // Naranja
    { base: '#EB4335', head: '#F57D73' }  // Rojo
];

let currentColorIndex = -1; // Empezamos en -1 para que la primera selección sea el índice 0

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

        currentColorIndex = -1; // Restablecer el índice
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
    }
}
