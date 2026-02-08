# 📚 Documentación de Snake Classic

Bienvenido a la documentación técnica de **Snake Classic** - un juego retro con estilo cyberpunk.

## 📁 Estructura de la Documentación

| Archivo | Descripción |
|---------|-------------|
| [SUPABASE.md](./SUPABASE.md) | Configuración y uso de Supabase local |
| [GAME_ARCHITECTURE.md](./GAME_ARCHITECTURE.md) | Arquitectura del juego |
| [EDGE_FUNCTIONS.md](./EDGE_FUNCTIONS.md) | Documentación de Edge Functions |
| [API.md](./API.md) | Referencia de la API del juego |
| [DESARROLLO.md](./DESARROLLO.md) | Guía para desarrolladores |

---

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Iniciar Supabase local
npm run supabase:start

# Iniciar servidor de desarrollo
npm run dev
```

Acceder a:
- **Juego**: http://localhost:5181
- **Supabase Studio**: http://127.0.0.1:3002

---

## 🛠️ Stack Tecnológico

| Tecnología | Uso |
|------------|-----|
| HTML5 Canvas | Renderizado del juego |
| JavaScript ES6+ | Lógica del juego (módulos) |
| CSS3 | Estilos cyberpunk |
| Supabase | Backend (Auth, DB, Realtime) |
| Docker | Entorno local de Supabase |
