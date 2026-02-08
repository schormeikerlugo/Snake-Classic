# 🛠️ Guía de Desarrollo

Guía para contribuir y desarrollar nuevas funcionalidades en Snake Classic.

---

## 🚀 Configuración del Entorno

### Requisitos
- Node.js 18+
- Docker Desktop
- Git

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/schormeikerlugo/Snake-Classic.git
cd Snake-Classic

# Instalar dependencias
npm install

# Iniciar Supabase local
npm run supabase:start

# Iniciar servidor de desarrollo
npm run dev
```

### URLs de Desarrollo

| Servicio | URL |
|----------|-----|
| Juego | http://localhost:5181 |
| Supabase Studio | http://127.0.0.1:3002 |
| API | http://127.0.0.1:54331 |
| Mailpit | http://127.0.0.1:54324 |

---

## 📁 Estructura del Proyecto

```
Snake-Classic/
├── index.html              # HTML principal
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker
├── package.json            # Dependencias npm
├── js/                     # Código fuente
│   ├── main.js            # Punto de entrada
│   ├── config/            # Configuración
│   ├── core/              # Núcleo del juego
│   ├── features/          # Funcionalidades online
│   ├── ui/                # Interfaz de usuario
│   ├── sound/             # Sistema de audio
│   ├── fx/                # Efectos visuales
│   ├── lib/               # Librerías
│   └── utils/             # Utilidades
├── styles/                 # CSS
├── assets/                 # Recursos
│   ├── audio/             # Música y efectos
│   ├── image/             # Imágenes
│   ├── font/              # Fuentes
│   └── locales/           # Traducciones
├── supabase/               # Backend local
│   ├── config.toml        # Configuración
│   ├── migrations/        # SQL migrations
│   └── functions/         # Edge Functions
├── docs/                   # Documentación
└── templates/              # Plantillas HTML
```

---

## 🧩 Agregar Nuevo Power-Up

### 1. Definir en `config/powerups.js`

```javascript
export const POWERUPS = {
  // ... existentes
  
  MI_POWERUP: {
    id: 'mi_powerup',
    name: 'Mi Power-Up',
    color: '#FF00FF',
    shape: 'star',        // triangle, circle, square, hexagon, star
    duration: 5000,       // ms (0 = instantáneo)
    effect: (game) => {
      // Lógica del efecto
    },
    onEnd: (game) => {
      // Limpiar efecto (opcional)
    }
  }
};
```

### 2. Agregar efecto de sonido

Colocar archivo en `assets/audio/game/efectos/MiPowerUp.mp3`

### 3. Agregar a `sfx.js`

```javascript
const sounds = {
  // ... existentes
  miPowerup: new Audio('assets/audio/game/efectos/MiPowerUp.mp3')
};
```

---

## 🗄️ Agregar Nueva Tabla en Supabase

### 1. Crear migración

```bash
# Crear archivo de migración
touch supabase/migrations/$(date +%Y%m%d%H%M%S)_mi_tabla.sql
```

### 2. Escribir SQL

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_mi_tabla.sql

CREATE TABLE mi_tabla (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  -- más columnas
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE mi_tabla ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "..." ON mi_tabla ...;
```

### 3. Aplicar migración

```bash
npm run supabase:db:reset
```

---

## ⚡ Crear Edge Function

### 1. Crear directorio

```bash
mkdir -p supabase/functions/mi-funcion
```

### 2. Crear `index.ts`

```typescript
// supabase/functions/mi-funcion/index.ts

Deno.serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Lógica
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});
```

### 3. Documentar

Agregar documentación en `docs/EDGE_FUNCTIONS.md`.

---

## 🎨 Estilos CSS

### Variables Globales

```css
/* styles/variables.css */
:root {
  --primary-color: #00FFFF;
  --secondary-color: #FF00FF;
  --bg-dark: #1a1f3a;
  --text-color: #ffffff;
  --glow-color: rgba(0, 255, 255, 0.5);
}
```

### Convenciones
- Usar variables CSS para colores
- Prefijo `.snake-` para clases del juego
- Mobile-first approach
- Animaciones con `@keyframes`

---

## 🧪 Testing

### Manual
1. Probar en desktop y móvil
2. Verificar responsive design
3. Probar autenticación
4. Verificar realtime (chat/ranking)

### Verificar Supabase
```bash
# Ver estado
npm run supabase:status

# Ver logs de DB
npx supabase db logs

# Reset completo
npm run supabase:db:reset
```

---

## 📝 Commits

Formato sugerido:

```
tipo(scope): descripción

tipos:
- feat: nueva funcionalidad
- fix: corrección de bug
- docs: documentación
- style: estilos
- refactor: refactorización
- test: tests
- chore: mantenimiento
```

Ejemplos:
```
feat(powerups): agregar power-up de teletransporte
fix(mobile): corregir area táctil en iOS
docs(api): documentar función submitScore
```

---

## 📦 Deploy

### GitHub Pages (Frontend)
```bash
git push origin main
# GitHub Actions despliega automáticamente
```

### Supabase Cloud (Backend)
1. Crear proyecto en supabase.com
2. Actualizar keys en `supabaseClient.js`
3. Ejecutar migraciones:
```bash
npx supabase db push --project-ref <ref>
npx supabase functions deploy --project-ref <ref>
```
