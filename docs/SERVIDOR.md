  # 🌐 Acceso Externo y Servidor

## 📦 Opciones de Servidor Local

### 1. Live Server (VS Code) - **Recomendado**
- Instalar extensión "Live Server" en VS Code
- Click derecho en `index.html` → "Open with Live Server"
- Usa puerto **5500** por defecto
- Auto-reload al editar archivos

### 2. http-server (npm)
```bash
npm run dev
# Abre http://localhost:5500
```

### 3. Python
```bash
python -m http.server 5500
```

---

## 🔗 ¿Por qué Live Server / Servidor Local?

El juego usa **módulos ES6** (`import`/`export`), los cuales **requieren un servidor HTTP**.
Abrir `index.html` directamente con `file://` no funciona debido a restricciones CORS.

### Compatibilidad con GitHub Pages
✅ El proyecto funciona en GitHub Pages sin cambios.  
GitHub Pages ya actúa como servidor HTTP.

---

## 🌍 Acceso Externo (Personas fuera de tu red local)

Para que otras personas puedan jugar desde internet, tienes estas opciones:

### Opción 1: Cloudflare Tunnel (Gratis, Recomendado)

```bash
# Instalar
sudo pacman -S cloudflared
# o
yay -S cloudflared

# Crear tunnel
cloudflared tunnel --url http://localhost:5500
```

Esto genera una URL pública como `https://xxxxx.trycloudflare.com`

### Opción 2: ngrok

```bash
# Instalar
sudo pacman -S ngrok
# o registrarse en ngrok.com

# Crear tunnel
ngrok http 5500
```

### Opción 3: Script automático

```bash
npm run tunnel
# o
./scripts/tunnel.sh
```

---

## ⚠️ Limitaciones del Acceso Externo con Supabase Local

**Problema**: Supabase local corre en `127.0.0.1:54331`, el cual no es accesible desde internet.

**Soluciones**:

### A. Usar Supabase Cloud (Producción)
La mejor opción para acceso externo:
1. Ir a https://supabase.com y crear proyecto
2. Actualizar keys en `supabaseClient.js`
3. El juego funcionará desde cualquier lugar

### B. Tunnel para Supabase también
Si necesitas desarrollo con acceso externo:

```bash
# Terminal 1: Tunnel para el juego
cloudflared tunnel --url http://localhost:5500

# Terminal 2: Tunnel para Supabase
cloudflared tunnel --url http://localhost:54331
```

Luego actualiza temporalmente `supabaseClient.js`:
```javascript
const SUPABASE_URL = 'https://xxxxx.trycloudflare.com'; // URL del tunnel
```

---

## 📊 Resumen de URLs

| Entorno | Juego | Supabase API |
|---------|-------|--------------|
| **Desarrollo Local** | http://localhost:5500 | http://127.0.0.1:54331 |
| **GitHub Pages** | https://user.github.io/Snake-Classic | https://xxx.supabase.co |
| **Tunnel** | https://xxx.trycloudflare.com | (requiere tunnel adicional) |

---

## 🚀 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run start` | Inicia Supabase |
| `npm run stop` | Detiene Supabase |
| `npm run dev` | Servidor en puerto 5500 |
| `npm run tunnel` | Crear túneles para acceso externo |
