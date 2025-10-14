import * as C from '../config/constants.js';

// Almacena las animaciones activas
let activeAnimations = [];

const BOMB_DURATION = 400; // ms
const SHRINK_DURATION = 300; // ms

/**
 * Dispara la animación de la bomba.
 * @param {Array} snakeBody - Una copia del cuerpo de la serpiente en el momento de la colisión.
 */
export function triggerBombAnimation(snakeBody) {
  activeAnimations.push({
    type: 'BOMB',
    startTime: Date.now(),
    snakeBody: [...snakeBody] // Copia para no afectar a la serpiente real
  });
}

/**
 * Dispara la animación de encogimiento.
 * @param {Array} removedSegments - Los segmentos que se han quitado de la cola.
 */
export function triggerShrinkAnimation(removedSegments) {
  if (removedSegments.length === 0) return;
  activeAnimations.push({
    type: 'SHRINK',
    startTime: Date.now(),
    segments: removedSegments
  });
}

/**
 * Actualiza y dibuja todas las animaciones activas.
 * Se llama en cada frame desde el bucle de renderizado principal.
 */
export function updateAndDrawAnimations(game) {
  const currentTime = Date.now();
  C.ctx.save();

  activeAnimations = activeAnimations.filter(anim => {
    const elapsedTime = currentTime - anim.startTime;

    if (anim.type === 'BOMB' && elapsedTime < BOMB_DURATION) {
      drawBomb(anim, elapsedTime, game);
      return true; // Mantener la animación
    } else if (anim.type === 'SHRINK' && elapsedTime < SHRINK_DURATION) {
      drawShrink(anim, elapsedTime, game);
      return true; // Mantener la animación
    }

    return false; // Eliminar la animación
  });

  C.ctx.restore();
}

// --- Funciones de dibujado privadas ---

function drawBomb(animation, elapsedTime, game) {
  const progress = elapsedTime / BOMB_DURATION;
  // Parpadeo: 4 veces durante la animación
  const flash = Math.floor(progress * 8) % 2 === 0;
  const color = flash ? '#FF0000' : '#300000'; // Rojo y rojo oscuro

  animation.snakeBody.forEach(seg => {
    const px = seg.x * game.cellSize;
    const py = seg.y * game.cellSize;
    C.ctx.fillStyle = color;
    C.ctx.fillRect(px, py, game.cellSize, game.cellSize);
  });
}

function drawShrink(animation, elapsedTime, game) {
  const progress = elapsedTime / SHRINK_DURATION;
  const scale = 1 - progress; // El tamaño disminuye de 1 a 0

  animation.segments.forEach(seg => {
    const px = seg.x * game.cellSize;
    const py = seg.y * game.cellSize;
    const size = game.cellSize * scale;

    C.ctx.fillStyle = '#FFFFFF'; // Color blanco para la implosión
    C.ctx.globalAlpha = scale; // Se desvanece
    C.ctx.fillRect(px + (game.cellSize - size) / 2, py + (game.cellSize - size) / 2, size, size);
  });
}
