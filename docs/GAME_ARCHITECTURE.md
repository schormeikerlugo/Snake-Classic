# 🎮 Arquitectura del Juego

## 📁 Estructura de Directorios

```
js/
├── main.js                 # Punto de entrada principal
├── config/                 # Configuración
│   ├── constants.js        # Constantes globales (canvas, DOM)
│   ├── colors.js           # Paleta de colores dinámica
│   └── powerups.js         # Definición de power-ups
├── core/                   # Núcleo del juego
│   ├── game.js            # Clase principal del juego
│   ├── gameLogic.js       # Lógica de movimiento y colisiones
│   ├── rendering.js       # Funciones de renderizado
│   └── gameLogic/         # Submódulos de lógica
│       ├── audioHelpers.js
│       ├── food.js
│       ├── obstacles.js
│       └── powerups.js
├── features/               # Funcionalidades online
│   ├── auth.js            # Autenticación de usuarios
│   ├── chat.js            # Chat en tiempo real
│   ├── ranking.js         # Tabla de clasificación
│   └── settings.js        # Configuración del juego
├── ui/                     # Interfaz de usuario
│   ├── modal.js           # Sistema de modales
│   ├── menu.js            # Menú principal
│   ├── ui.js              # Utilidades de UI
│   ├── mobile-views.js    # Vistas móviles
│   └── update.js          # Actualización de Service Worker
├── sound/                  # Sistema de audio
│   ├── audio.js           # Música de fondo
│   └── sfx.js             # Efectos de sonido
├── fx/                     # Efectos visuales
│   └── particles.js       # Sistema de partículas
├── lib/                    # Librerías
│   └── supabaseClient.js  # Cliente de Supabase
└── utils/                  # Utilidades
    └── utils.js           # Funciones helper
```

---

## 🧩 Módulos Principales

### 1. `game.js` - Clase Principal

Encapsula todo el estado y lógica del juego.

```javascript
class Game {
  constructor() {
    this.snake = [];        // Segmentos de la serpiente
    this.food = null;       // Posición de la comida
    this.direction = 'right';
    this.score = 0;
    this.bestScore = 0;
    this.isPaused = false;
    this.isGameOver = false;
  }
}
```

### 2. `gameLogic.js` - Lógica del Juego

| Función | Descripción |
|---------|-------------|
| `moveSnake()` | Actualiza posición de la serpiente |
| `checkCollision()` | Detecta colisiones con paredes/cuerpo |
| `checkFoodCollision()` | Verifica si come comida |
| `updateScore()` | Actualiza puntuación |

### 3. `rendering.js` - Renderizado

| Función | Descripción |
|---------|-------------|
| `drawSnake()` | Dibuja serpiente con gradiente |
| `drawFood()` | Dibuja comida |
| `drawObstacles()` | Dibuja obstáculos |
| `drawPowerups()` | Dibuja power-ups |

---

## 🎨 Sistema de Colores Dinámicos

La serpiente cambia de color cada 10 puntos:

```javascript
const colorPalette = [
  '#00FFFF', // Cyan
  '#FF00FF', // Magenta
  '#FFFF00', // Amarillo
  '#00FF00', // Verde
  '#FF6B6B', // Rojo coral
  '#9B59B6', // Púrpura
];
```

---

## ⚡ Power-Ups

| Power-Up | Forma | Color | Efecto | Duración |
|----------|-------|-------|--------|----------|
| Ralentizar | Triángulo | Azul | Reduce velocidad | 10s |
| Puntos Dobles | Cuadrilátero | Amarillo | ×2 puntos | 15s |
| Inmunidad | Hexágono | Verde | Sin colisiones | 10s |
| Encoger | Círculo | Morado | Reduce tamaño | Instantáneo |
| Limpiar Obstáculos | Estrella | Rojo | Elimina obstáculos | Instantáneo |
| Bomba | Cuadrado | Gris | -Puntos | Instantáneo |

---

## 🔊 Sistema de Audio

### Música de Fondo
- 4 pistas en `/assets/audio/game/`
- Cambio cíclico de pistas

### Efectos de Sonido
| Evento | Archivo |
|--------|---------|
| Comer comida | `comer.wav` |
| Bonus (cada 10pts) | `bonus.wav` |
| Pausar | `pausa.ogg` |
| Game Over | `game-over.wav` |
| Abrir modal | `abrir-modal.ogg` |
| Cerrar modal | `cerrar-modal.ogg` |
| Power-ups | Archivos individuales |

---

## 📱 Controles

### Desktop
| Acción | Teclas |
|--------|--------|
| Mover | ↑↓←→ o WASD |
| Pausar | Espacio |
| Reiniciar | Botón UI |

### Mobile
- D-pad virtual con botones táctiles
- Botones de pausa y reinicio reposicionados
- Área táctil circular para mejor precisión

---

## 🔄 Game Loop

```javascript
function gameLoop(timestamp) {
  // 1. Calcular delta time
  const deltaTime = timestamp - lastTime;
  
  // 2. Actualizar lógica (si no pausado)
  if (!isPaused && !isGameOver) {
    update(deltaTime);
  }
  
  // 3. Renderizar
  render();
  
  // 4. Solicitar siguiente frame
  requestAnimationFrame(gameLoop);
}
```

---

## 🌐 Integración con Supabase

### Autenticación (`auth.js`)
- Registro/Login con email
- Subida de avatares
- Gestión de sesión

### Ranking (`ranking.js`)
- Carga los top 10 scores
- Suscripción realtime a cambios
- Actualización automática

### Chat (`chat.js`)
- Mensajes en tiempo real
- Auto-scroll con indicador
- Perfiles de usuarios
