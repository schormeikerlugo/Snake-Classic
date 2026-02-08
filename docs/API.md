# 🔌 API Reference

Documentación de las funciones y módulos exportados del juego.

---

## 📦 Módulo: `supabaseClient.js`

### Exportaciones

```javascript
export const supabase: SupabaseClient
```

Cliente configurado automáticamente para desarrollo local o producción.

---

## 📦 Módulo: `auth.js`

### `initAuth()`
Inicializa el sistema de autenticación.

```javascript
import { initAuth } from './features/auth.js';

initAuth(); // Configura listeners y formularios
```

### Eventos Internos
- `onAuthStateChange`: Actualiza UI según estado de sesión
- `handleAuthFormSubmit`: Procesa login/registro
- `handleLogout`: Cierra sesión
- `handleAvatarUpload`: Sube avatar a Storage

---

## 📦 Módulo: `ranking.js`

### `initRanking(container)`
Inicializa el ranking con suscripción realtime.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `container` | HTMLElement | Elemento donde mostrar el ranking |

```javascript
import { initRanking } from './features/ranking.js';

const container = document.getElementById('ranking-container');
initRanking(container);
```

---

## 📦 Módulo: `chat.js`

### `initChat()`
Inicializa el chat con suscripción realtime.

```javascript
import { initChat } from './features/chat.js';

await initChat();
```

### Funcionalidades
- Carga últimos 50 mensajes
- Suscripción a nuevos mensajes
- Auto-scroll inteligente
- Indicador de nuevos mensajes

---

## 📦 Módulo: `game.js`

### Clase `Game`

```javascript
class Game {
  snake: Array<{x, y}>    // Segmentos de la serpiente
  food: {x, y}            // Posición de comida
  direction: string       // 'up' | 'down' | 'left' | 'right'
  score: number           // Puntuación actual
  bestScore: number       // Mejor puntuación
  isPaused: boolean       // Estado de pausa
  isGameOver: boolean     // Estado game over
  powerups: Array         // Power-ups activos
  obstacles: Array        // Obstáculos en el mapa
}
```

### Métodos Principales

| Método | Descripción |
|--------|-------------|
| `start()` | Inicia nueva partida |
| `pause()` | Pausa/reanuda el juego |
| `restart()` | Reinicia la partida |
| `update()` | Actualiza estado del juego |
| `render()` | Dibuja frame actual |

---

## 📦 Módulo: `colors.js`

### `getCurrentColor(score)`
Devuelve el color actual basado en la puntuación.

```javascript
import { getCurrentColor } from './config/colors.js';

const color = getCurrentColor(25); // Cambia cada 10 puntos
```

### `getColorPalette()`
Devuelve la paleta completa de colores.

---

## 📦 Módulo: `sfx.js`

### `playSfx(soundName)`
Reproduce un efecto de sonido.

| Nombre | Archivo | Evento |
|--------|---------|--------|
| `eat` | comer.wav | Al comer comida |
| `bonus` | bonus.wav | Cada 10 puntos |
| `pause` | pausa.ogg | Al pausar |
| `gameOver` | game-over.wav | Al perder |
| `modalOpen` | abrir-modal.ogg | Abrir modal |
| `modalClose` | cerrar-modal.ogg | Cerrar modal |

```javascript
import { playSfx } from './sound/sfx.js';

playSfx('eat');
```

---

## 📦 Módulo: `modal.js`

### `showModal(title, content)`
Muestra un modal con contenido personalizado.

```javascript
import { showModal, hideModal } from './ui/modal.js';

showModal('¡Game Over!', '<p>Tu puntuación: 150</p>');
```

### `hideModal()`
Cierra el modal activo.

---

## 📦 Módulo: `powerups.js`

### Configuración de Power-ups

```javascript
export const POWERUPS = {
  SLOW: {
    id: 'slow',
    name: 'Ralentizar',
    color: '#00BFFF',
    shape: 'triangle',
    duration: 10000,
    effect: (game) => { /* ... */ }
  },
  // ... más power-ups
};
```

### `spawnPowerup()`
Genera un power-up aleatorio en el mapa.

### `activatePowerup(game, powerup)`
Activa el efecto del power-up.

---

## 🔄 Estado Global

El juego mantiene estado en:

1. **LocalStorage**
   - `bestScore`: Mejor puntuación local
   - `masterVolume`: Volumen del audio
   - `language`: Idioma seleccionado

2. **Supabase**
   - Puntuaciones globales
   - Perfiles de usuario
   - Mensajes de chat
