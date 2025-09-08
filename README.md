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
| Pausar / Reanudar      | Barra espaciadora                             |
| Reiniciar              | Boton de reinicio                             |
| Volver al menú         | Boton de menu                                 |

## 📔 Nota
¡El juego es completamente responsive, así que el mismo teclado o pantalla táctil funciona en cualquier dispositivo! 

---

## 🌟 Características especiales

- 🎞️ **Interpolación**: Movimiento suave de la serpiente con `requestAnimationFrame`.
- 💡 **Efecto Glow**: Luces suaves y animadas. Personalizable vía `--snake-glow-sound` en `config.js`.
- 🛑 **Game‑Over Overlay**: Animación tipo *scanner* que se despliega al chocar.
- 🏆 **Best Score**: Guardado en `localStorage` con persistencia y visualización clara.
- 🔊 **Audio**: Beep al comer, bite de la serpiente y efectos con la Web Audio API.
- 📱 **Móvil Friendly**: Gestos táctiles y controles WASD funcionan igual que en PC.
- 📊 **Pantalla de Puntuaciones**: Interfaz clara con el mejor puntaje y botón `Reset`.

## 🎯 Roadmap – Futuras mejoras

## 🧠 Roadmap de Features

Cada idea está organizada por estado, tipo de mejora y detalles técnicos. Este formato facilita la colaboración, el seguimiento y la expansión del universo Snake Classic.

| 🧩 Feature                  | 📌 Estado         | 🧪 Tipo de Mejora     | ⚙️ Detalles Técnicos                                                                 |
|----------------------------|------------------|-----------------------|--------------------------------------------------------------------------------------|
| Modo Obstáculos            | ✅ Propuesta      | Jugabilidad           | Paredes internas que aumentan la dificultad progresivamente.                        |
| Nuevos colores de serpiente| 🎨 En diseño      | Estética / UI         | Personalización vía variables CSS (`--snake-color`, `--snake-glow`, etc.).          |
| Power‑Ups                  | 🧪 En pruebas      | Mecánicas             | Ralentizar, duplicar puntos, invulnerabilidad temporal.                             |
| Modo multijugador          | 🔄 En prototipo   | Jugabilidad avanzada  | Dos serpientes compiten por la misma comida. Requiere sincronización de inputs.     |
| Leaderboard online         | 🌐 En exploración | Backend / Persistencia| Integración con Firebase o backend modular para puntajes globales persistentes.     |


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

## 📜 Términos y Condiciones de Uso – Snake Classic

Al descargar, ejecutar o modificar este juego, aceptas los siguientes términos:

### 1. 📦 Uso Personal y Educativo
Este proyecto está disponible para fines personales, educativos y de aprendizaje. Puedes jugarlo, estudiarlo y modificarlo para mejorar tus habilidades técnicas o creativas.

### 2. 🚫 Uso Comercial
No está permitido distribuir, vender o monetizar este juego (ni sus variantes) sin autorización expresa del autor. Si deseas incluirlo en un producto comercial, contáctame previamente.

### 3. 🧠 Propiedad Intelectual
Todos los assets visuales, efectos de sonido, animaciones y código original están protegidos por derechos de autor. Las contribuciones externas están acreditadas en la sección de colaboradores.

### 4. 🔧 Modificaciones
Puedes modificar el código para uso personal o educativo. Si publicas una variante, se recomienda incluir créditos al autor original y especificar los cambios realizados.

### 5. 🐞 Responsabilidad
Este juego se ofrece "tal cual", sin garantías. No me hago responsable por daños, pérdidas o conflictos derivados del uso del software.

### 6. 🤝 Colaboraciones
Si deseas contribuir con mejoras, assets, traducciones o nuevas mecánicas, eres bienvenido. Revisa el roadmap y abre un issue o pull request con tu propuesta.

© 2024 Retro Snake Classic.

**Gracias por apoyar este proyecto retro-futurista. Tu respeto por estos términos permite que siga creciendo y evolucionando.**

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