/**
 * Dibuja el efecto de inmunidad en la serpiente.
 * La serpiente tendrá un cuerpo con un degradado oscuro y un borde del color original.
 * @param {CanvasRenderingContext2D} ctx - El contexto del canvas.
 * @param {Array} snakeBody - El cuerpo de la serpiente.
 * @param {string} color - El color original de la serpiente.
 * @param {number} cellSize - El tamaño de la celda del juego.
 */
export function drawImmunityEffect(ctx, snakeBody, color, cellSize) {
  const borderWidth = 2; // Ancho del borde

  snakeBody.forEach(segment => {
    // Dibuja el borde
    ctx.fillStyle = color;
    ctx.fillRect(segment.x, segment.y, cellSize, cellSize);

    // Dibuja el cuerpo oscuro "galaxia"
    const innerSize = cellSize - borderWidth * 2;
    const gradient = ctx.createRadialGradient(
      segment.x + cellSize / 2, segment.y + cellSize / 2, 0,
      segment.x + cellSize / 2, segment.y + cellSize / 2, cellSize / 2
    );
    gradient.addColorStop(0, '#4a0e6c'); // Morado oscuro
    gradient.addColorStop(1, '#000000'); // Negro

    ctx.fillStyle = gradient;
    ctx.fillRect(segment.x + borderWidth, segment.y + borderWidth, innerSize, innerSize);
  });
}

/**
 * Dibuja el efecto de puntos dobles en la serpiente.
 * La serpiente parpadea con un color dorado.
 * @param {CanvasRenderingContext2D} ctx - El contexto del canvas.
 * @param {Array} snakeBody - El cuerpo de la serpiente.
 * @param {number} cellSize - El tamaño de la celda del juego.
 * @param {number} currentTime - El tiempo actual para la animación de pulso.
 */
export function drawDoublePointsEffect(ctx, snakeBody, cellSize, currentTime) {
  const pulse = Math.sin(currentTime / 150) * 0.5 + 0.5; // Onda sinusoidal para el pulso (0 a 1)
  const color1 = '#FFD700'; // Oro
  const color2 = '#FFA500'; // Naranja dorado

  const goldColor = pulse > 0.5 ? color1 : color2;

  snakeBody.forEach(segment => {
    ctx.fillStyle = goldColor;
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = 10 * pulse;
    ctx.fillRect(segment.x, segment.y, cellSize, cellSize);
  });

  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
}

/**
 * Dibuja el efecto de ralentización en la serpiente.
 * La serpiente se vuelve azul y tiene un efecto de onda.
 * @param {CanvasRenderingContext2D} ctx - El contexto del canvas.
 * @param {Array} snakeBody - El cuerpo de la serpiente.
 * @param {number} cellSize - El tamaño de la celda del juego.
 * @param {number} currentTime - El tiempo actual para la animación de onda.
 */
export function drawSlowDownEffect(ctx, snakeBody, cellSize, currentTime) {
  const slowDownColor = '#00BFFF'; // Azul profundo cielo

  snakeBody.forEach((segment, index) => {
    const wave = Math.sin(currentTime / 200 + index / 3) * (cellSize / 12); // Reducido de / 6 a / 12 para un efecto más sutil
    
    // Aplicamos el desplazamiento de la onda. La dirección del desplazamiento
    // podría depender de la dirección de la serpiente para un efecto más avanzado,
    // pero por ahora un desplazamiento simple en x e y funciona.
    const x = segment.x + wave;
    const y = segment.y + wave;

    ctx.fillStyle = slowDownColor;
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = 5;
    ctx.fillRect(x, y, cellSize, cellSize);
  });

  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
}
