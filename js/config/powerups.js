export const POWER_UP_TYPES = {
    SLOW_DOWN: {
        type: 'SLOW_DOWN',
        color: '#3498db', // Blue
        shape: 'triangle',
        duration: 10000, // 10 seconds
    },
    DOUBLE_POINTS: {
        type: 'DOUBLE_POINTS',
        color: '#f1c40f', // Yellow
        shape: 'quadrilateral',
        duration: 15000, // 15 seconds
    },
    IMMUNITY: {
        type: 'IMMUNITY',
        color: '#2ecc71', // Green
        shape: 'hexagon',
        duration: 10000, // 10 seconds
    },
    SHRINK: {
        type: 'SHRINK',
        color: '#9b59b6', // Purple
        shape: 'circle',
        instant: true,
    },
    CLEAR_OBSTACLES: {
        type: 'CLEAR_OBSTACLES',
        color: '#e74c3c', // Red
        shape: 'star',
        instant: true,
    },
    BOMB: {
        type: 'BOMB',
        color: '#95a5a6', // Gray
        shape: 'square',
        instant: true,
    }
};

export const POWER_UP_CONFIG = {
    spawnInterval: 20000, // 20 seconds
};