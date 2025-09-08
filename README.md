# 🐍 **Retro Snake Classic** – *The pixel‑perfect nostalgia machine!*

> ¡Qué tal, amigo!  
> Este proyecto es mi propio *Snake Classic*, un juego retro que he estado desarrollando con mucho cariño y una pizca de magia JavaScript.  
> Si te gusta el estilo 8‑bits y el desafío sin fin de los serpientes comestibles, **¡este README está hecho para ti!**  
> ¡Vamos a sumergirnos en la historia, las tecnologías, la jugabilidad y cómo puedes contribuir a la evolución de este clásico!

---

## 🎮 ¿Qué es Retro Snake Classic?

Retro Snake Classic es una versión moderna del icónico juego **Snake** que muchos recuerdan de las cajitas de videojuegos de los 90. La experiencia está construida con:

- **HTML5 Canvas** (para gráficos en 2‑D pixelados)
- **CSS3** (variables para colores y sombras)
- **JavaScript ES6+** (manejo modular, eventos, audio)
- **Web Audio API** (sonidos de bite, beep y efectos especiales)
- **Responsive design** (compatible con móvil y escritorio)

¡El objetivo sigue siendo el mismo: controla la serpiente, come comida, crece más rápido y evita chocar contra las paredes o tu propio cuerpo! 🎯

---

## 📸 **Captura de pantalla (demo)**


![JUGADOR](assets/image/readme/1.png)
![JUGADOR](assets/image/readme/2.png)
![JUGADOR](assets/image/readme/3.png)
![JUGADOR](assets/image/readme/4.png)
![JUGADOR](assets/image/readme/5.png)
![JUGADOR](assets/image/readme/6.png)

> *¡Mira cómo la serpiente se desliza suavemente y brilla con luces sutiles mientras avanza!*

---

## 📦 Como jugar ?

> **Todo lo que necesitas**: ingrea a la web y diviertete como nunca: 
> https://schormeikerlugo.github.io/Snake-Classic/

---

## 🛠️ **EStructura del proyecto**

## 🕹️ Estructura del Proyecto Snake Classic

| 📁 Carpeta / Archivo               | 🧾 Descripción                                                                 |
|-----------------------------------|--------------------------------------------------------------------------------|
| `index.html`                      | 🚀 Entrada HTML que carga todo el juego.                                       |
| `snake/`                          | 🎮 Carpeta principal con el código fuente.                                     |
| `snake/src/`                      | 🧩 Código modular:<br>• `constants.js` – ⚙️ Configuración y elementos del DOM.<br>• `audio.js` – 🔊 API de audio y efectos.<br>• `audio-config.js` – 🎚️ Configuración de sonidos.<br>• `bestscore.js` – 🏆 Manejo del puntaje más alto.<br>• `bestscore-config.js` – 🧠 Configuración, pantalla e inicialización del bestscore.<br>• `config.js` – 🎨 Configuración global (colores, canvas, etc.). |
| `snake/src/modules/`              | 🛠️ Módulos separados:<br>• `core.js`, `game.js`, `game-over.js`, `rendering.js`.<br>• Archivos compartidos: `constants.js`, `audio.js`, `config.js`, `bestscore.js`, `audio-config.js`, `bestscore-config.js`. |
| `snake/README.md`                 | 📘 Tu nuevo README – redactado con estilo y claridad.                          |
| `snake/.github/workflows/`        | ⚙️ Archivos de CI para GitHub Actions.                                         |

---

### 🎨 Estilo visual sugerido
- **Pixelart + Cyberpunk**: tipografías monoespaciadas, colores neón (#00FFFF, #FF00FF), bordes tipo CRT.
- **Microinteracciones**: animaciones sutiles en hover para botones y puntajes.
- **Modularidad visual**: cada componente puede tener su propio tema (ej. audio = ondas, bestscore = medallas).

## 📔 Nota:
 Cada módulo exporta/consume funciones y constantes de manera clara y reutilizable, facilitando la adición de nuevas características. 

---

 ## 🎮 Cómo jugar 

| 🕹️ Acción             | ⌨️ Control                                     |
|------------------------|-----------------------------------------------|
| Mover la serpiente     | Flechas ↔️ ↕️ &nbsp; *o* &nbsp; W, A, S, D    |
| Pausar / Reanudar      | P                                             |
| Reiniciar              | R *(solo después de Game Over)*               |
| Volver al menú         | Enter *(en la pantalla de inicio)*            |

## 📔 Nota
¡El juego es completamente responsive, así que el mismo teclado o pantalla táctil funciona en cualquier dispositivo! 

---

## 🌟 Características especiales

## ✨ Características Visuales y Funcionales

- 🎞️ **Interpolación**: Movimiento suave de la serpiente con `requestAnimationFrame`.
- 💡 **Efecto Glow**: Luces suaves y animadas. Personalizable vía `--snake-glow-sound` en `config.js`.
- 🛑 **Game‑Over Overlay**: Animación tipo *scanner* que se despliega al chocar.
- 🏆 **Best Score**: Guardado en `localStorage` con persistencia y visualización clara.
- 🔊 **Audio**: Beep al comer, bite de la serpiente y efectos con la Web Audio API.
- 📱 **Móvil Friendly**: Gestos táctiles y controles WASD funcionan igual que en PC.
- 📊 **Pantalla de Puntuaciones**: Interfaz clara con el mejor puntaje y botón `Reset`.

## 🎯 Roadmap – Futuras mejoras

✔️
Idea
1️⃣ **Modo Obstáculos** – paredes internas que se vuelven cada vez más difíciles.
2️⃣ **Nuevos colores de serpiente** – cambiar la paleta de CSS variables.
3️⃣ **Power‑Ups** – ralentizar a la serpiente, ganar puntos extra, etc.
4️⃣ **Modo multijugador** – dos serpientes compiten por la misma comida.
5️⃣ **Leaderboard online** – sincronizar el mejor puntaje global a través de Firebase o un backend

## 📔 Nota
Estas ideas están abiertas para que los implementes o sugieras en Issues! 🎯

---

## 🤝 Cómo contribuir

1️⃣ Fork este repositorio y crea tu rama (git checkout -b feature-nueva-serpiente).
2️⃣ Haz los cambios y confirma tus commits con mensajes claros (feat: agregar modo multijugador).
3️⃣ Abre un Pull Request con una descripción detallada.
4️⃣ ¡El mantenedor revisará tu contribución lo antes posible! 🚀

🪙  Si te gustó este proyecto y quieres apoyar su evolución, puedes hacer una donación para ayudarme a seguir desarrollando nuevas variantes visuales, efectos pixelart, microinteracciones y compatibilidad avanzada con entornos Linux. Cada aporte impulsa la creación de experiencias más pulidas, modulares y accesibles para todos. ¡Gracias por ser parte de esta misión retro-futurista! 💜

Bitcoin : bc1qngxlgsz3tj6v9kkgumv0fnrf7fsfn9wjesjghr
USDT (TRON): TL3Vwuyf1iA86nB6vzXiNbtgdYBrWLxEEi

## 📜 Licencia

© 2024 Retro Snake Classic – Licencia MIT.
Puedes usar este código, modificarlo y redistribuirlo libremente bajo los mismos términos. 

---

## 🤝 Contribuyentes


| 👤 Contribuyente            | 🧰 Rol                                                                 |
|----------------------|------------------------------------------------------------------------|
| **Schormeiker Lugo**        | 🧠 Desarrollo principal, 🎨 diseño de UI/UX, 🧩 arquitectura modular.  |
| **Free Music - Lifeformed.**| 🔊 Audio y efectos de sonido.                                          |
| **Colaborador Y**           | ⚡ Optimización de la animación y 🧪 pruebas de rendimiento.           |

---

## 📬 Soporte y dudas

Si tienes alguna pregunta, problema o sugerencia, abre un issue y lo revisaremos lo antes posible.

¡No dudes en proponer mejoras, reportar bugs o compartir ideas frescas!

## 🙏 Agradecimientos

. Inspiración retro: Gracias a los viejos cartuchos de Atari y Nintendo que nos enseñaron a amar el pixel‑art.
. Frameworks de la comunidad: HTML5 Canvas, CSS3 y JavaScript por la robustez y flexibilidad.
. Todos los testers que se atrevieron a romper la serpiente.

## 🚀 ¡Listo para jugar y hacer historia juntos?

Abraza el desafío, comparte el juego y haz crecer este clásico.
¡Nos vemos en el tablero! 👋