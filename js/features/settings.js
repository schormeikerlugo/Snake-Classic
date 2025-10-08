export const settings = {
    sound: true, // El sonido está activado por defecto
    masterVolume: Number(localStorage.getItem('snake_volume') ?? 1), // Volumen maestro (0.0 a 1.0)
    obstacles: false, // El modo de obstáculos está desactivado por defecto
};

