/**
 * @file powerupDemos.js
 * 
 * Este módulo se encarga de generar y gestionar las demos animadas de los power-ups
 * que se muestran en el modal "Cómo Jugar".
 * Es un sistema autónomo que crea pequeños canvas y ejecuta animaciones en bucle
 * para cada tipo de power-up, mostrando su efecto visual.
 */

import { POWER_UP_TYPES } from '../config/powerups.js';
import { drawImmunityEffect, drawDoublePointsEffect, drawSlowDownEffect } from '../fx/snakeEffects.js';
import { getTranslation } from '../utils/language.js';

// --- Drawing functions for static icons ---

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

function drawPowerUpIcon(canvas, powerUpConfig) {
    const ctx = canvas.getContext('2d');
    const size = canvas.width * 0.8; // Use 80% of canvas size
    const half = size / 2;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.fillStyle = powerUpConfig.color;
    ctx.strokeStyle = powerUpConfig.color;
    ctx.lineWidth = 2;

    switch (powerUpConfig.shape) {
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

// --- Estado y Renderizadores para las Demos ---

// Serpiente de ejemplo para las demos
const demoSnake = [{ x: 10, y: 30 }, { x: 20, y: 30 }, { x: 30, y: 30 }, { x: 40, y: 30 }, { x: 50, y: 30 }];
const demoCellSize = 10;

// Funciones de dibujado específicas para cada demo
const demoRenderers = {
    IMMUNITY: (ctx, time) => {
        // Re-implementamos una versión simple del efecto con gradiente animado
        const pulse = Math.sin(time / 500) * 0.5 + 0.5; // Pulso lento
        const borderWidth = 2;
        demoSnake.forEach(segment => {
            ctx.fillStyle = '#2ecc71'; // Color del borde
            ctx.fillRect(segment.x, segment.y, demoCellSize, demoCellSize);
            const innerSize = demoCellSize - borderWidth * 2;
            const gradient = ctx.createRadialGradient(
                segment.x + demoCellSize / 2, segment.y + demoCellSize / 2, 0,
                segment.x + demoCellSize / 2, segment.y + demoCellSize / 2, (demoCellSize / 2) * pulse
            );
            gradient.addColorStop(0, '#4a0e6c');
            gradient.addColorStop(1, '#000000');
            ctx.fillStyle = gradient;
            ctx.fillRect(segment.x + borderWidth, segment.y + borderWidth, innerSize, innerSize);
        });
    },
    DOUBLE_POINTS: (ctx, time) => {
        drawDoublePointsEffect(ctx, demoSnake, demoCellSize, time);
    },
    SLOW_DOWN: (ctx, time) => {
        drawSlowDownEffect(ctx, demoSnake, demoCellSize, time);
    },
    BOMB: (ctx, time) => {
        const progress = (time % 1000) / 1000; // Animación de 1s en bucle
        const flash = Math.floor(progress * 4) % 2 === 0;
        const color = flash ? '#e74c3c' : '#95a5a6';
        demoSnake.forEach(seg => {
            ctx.fillStyle = color;
            ctx.fillRect(seg.x, seg.y, demoCellSize, demoCellSize);
        });
    },
    SHRINK: (ctx, time) => {
        const progress = (time % 1500) / 1500; // Animación de 1.5s en bucle
        const segmentsToShow = demoSnake.length - Math.floor(progress * demoSnake.length);
        const snakeBody = demoSnake.slice(0, segmentsToShow);
        
        ctx.fillStyle = '#9b59b6';
        snakeBody.forEach(seg => {
            ctx.fillRect(seg.x, seg.y, demoCellSize, demoCellSize);
        });
    },
    CLEAR_OBSTACLES: (ctx, time) => {
        const progress = (time % 2000) / 2000; // Animación de 2s en bucle
        const obstacles = [{x: 20, y: 10}, {x: 70, y: 45}, {x: 40, y: 5}];

        // Dibuja la serpiente de color rojo para asociarla con el power-up
        ctx.fillStyle = '#e74c3c';
        demoSnake.forEach(seg => ctx.fillRect(seg.x, seg.y, demoCellSize, demoCellSize));

        // Dibuja los obstáculos desapareciendo
        if (progress < 0.7) { // Muestra los obstáculos durante el 70% del tiempo
            ctx.fillStyle = '#95a5a6';
            obstacles.forEach(obs => {
                ctx.fillRect(obs.x, obs.y, demoCellSize, demoCellSize);
            });
        } else {
            // Efecto de "explosión" simple
            const explosionProgress = (progress - 0.7) / 0.3;
            const radius = explosionProgress * 15;
            ctx.strokeStyle = 'white';
            ctx.globalAlpha = 1 - explosionProgress;
            obstacles.forEach(obs => {
                ctx.beginPath();
                ctx.arc(obs.x + demoCellSize / 2, obs.y + demoCellSize / 2, radius, 0, Math.PI * 2);
                ctx.stroke();
            });
            ctx.globalAlpha = 1;
        }
    }
};

// Almacena los IDs de los bucles de animación para poder detenerlos si el modal se cierra.
const activeAnimationLoops = [];

/**
 * Crea una animación de demo para un power-up específico en un canvas determinado.
 * @param {HTMLCanvasElement} canvas - El canvas donde se dibujará la animación.
 * @param {string} powerUpType - El tipo de power-up a demostrar (ej. 'IMMUNITY').
 */
function createDemoAnimation(canvas, powerUpType) {
    const ctx = canvas.getContext('2d');
    const renderer = demoRenderers[powerUpType];

    if (!renderer) {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
    }

    let animationId;
    function loop(time) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        renderer(ctx, time);
        animationId = requestAnimationFrame(loop);
    }

    loop(0);
    activeAnimationLoops.push(animationId);
}

/**
 * Detiene todas las animaciones de demo activas.
 */
export function stopPowerUpDemos() {
    activeAnimationLoops.forEach(id => cancelAnimationFrame(id));
    activeAnimationLoops.length = 0; // Limpiar el array
}

/**
 * Inicializa todas las demos de power-ups dentro de un elemento contenedor.
 * @param {HTMLElement} container - El elemento del DOM donde se inyectarán las demos.
 */
export function initializePowerupDemos(container) {
    container.innerHTML = '';
    stopPowerUpDemos();

    for (const key in POWER_UP_TYPES) {
        const config = POWER_UP_TYPES[key];

        const demoWrapper = document.createElement('div');
        demoWrapper.className = 'powerup-demo';
        demoWrapper.style.borderLeftColor = config.color;

        const textWrapper = document.createElement('div');
        textWrapper.className = 'powerup-demo-text';

        const titleWrapper = document.createElement('div');
        titleWrapper.className = 'powerup-title-wrapper';

        const iconCanvas = document.createElement('canvas');
        iconCanvas.width = 24;
        iconCanvas.height = 24;
        iconCanvas.className = 'powerup-icon-canvas';

        const title = document.createElement('h4');
        title.textContent = key.replace(/_/g, ' ');
        title.style.color = config.color;

        titleWrapper.appendChild(iconCanvas);
        titleWrapper.appendChild(title);

        const description = document.createElement('p');
        description.dataset.translateKey = config.description;

        const demoCanvas = document.createElement('canvas');
        demoCanvas.width = 100;
        demoCanvas.height = 60;
        demoCanvas.className = 'powerup-demo-canvas';

        textWrapper.appendChild(titleWrapper);
        textWrapper.appendChild(description);
        demoWrapper.appendChild(demoCanvas);
        demoWrapper.appendChild(textWrapper);
        container.appendChild(demoWrapper);

        drawPowerUpIcon(iconCanvas, config);
        createDemoAnimation(demoCanvas, key);
    }
}
