
let particles = [];

const PARTICLE_CONFIG = {
    count: 8,           // Number of particles per segment (reduced from 15)
    lifespan: 600,      // ms (reduced from 800)
    gravity: 0.05,      // A slight pull downwards
    baseVelocity: 1.5,  // Base speed
};

/**
 * Creates a burst of particles at a specific grid location.
 * @param {number} x - The grid x-coordinate.
 * @param {number} y - The grid y-coordinate.
 * @param {string} color - The color of the particles.
 * @param {number} cellSize - The size of a grid cell in pixels.
 */
export function createShrinkParticles(x, y, color, cellSize) {
    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;

    for (let i = 0; i < PARTICLE_CONFIG.count; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const velocity = Math.random() * PARTICLE_CONFIG.baseVelocity;

        particles.push({
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity,
            alpha: 1,
            color: color,
            lifespan: PARTICLE_CONFIG.lifespan,
            startTime: Date.now(),
        });
    }
}

export function createObstacleClearParticles(obstacles, color, cellSize) {
    obstacles.forEach(obstacle => {
        createShrinkParticles(obstacle.x, obstacle.y, color, cellSize);
    });
}

/**
 * Updates and draws all active particles.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 */
export function updateAndDrawParticles(ctx) {
    const now = Date.now();
    
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        const elapsed = now - p.startTime;

        if (elapsed > p.lifespan) {
            particles.splice(i, 1);
            continue;
        }

        // Update position
        p.x += p.vx;
        p.y += p.vy;
        // Apply gravity
        p.vy += PARTICLE_CONFIG.gravity;
        
        // Update alpha (fade out)
        p.alpha = 1 - (elapsed / p.lifespan);

        // Draw particle
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(p.x - 1, p.y - 1, 3, 3); // Draw 3x3 pixel particles
    }
    
    // Reset global alpha
    ctx.globalAlpha = 1;
}
