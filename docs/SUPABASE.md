# ☁️ Supabase - Configuración y Uso

## 🌐 URLs de Servicios (Desarrollo Local)

| Servicio | URL | Puerto |
|----------|-----|--------|
| **API Gateway** | http://127.0.0.1:54331 | 54331 |
| **Studio** | http://127.0.0.1:3002 | 3002 |
| **Database** | localhost:54332 | 54332 |
| **Mailpit** | http://127.0.0.1:54324 | 54324 |

> ⚠️ **Nota**: Estos puertos fueron elegidos para evitar conflictos con el proyecto Kepler.

---

## 🗄️ Esquema de Base de Datos

### Tabla: `perfiles`
Almacena información de los usuarios registrados.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID (PK) | ID del usuario (referencia a `auth.users`) |
| `username` | TEXT | Nombre de usuario |
| `avatar_url` | TEXT | URL del avatar |
| `created_at` | TIMESTAMPTZ | Fecha de creación |

### Tabla: `puntuaciones`
Almacena las mejores puntuaciones de cada jugador.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID (PK) | ID único |
| `user_id` | UUID (FK) | Referencia a `perfiles.id` |
| `best_score` | INTEGER | Mejor puntuación del jugador |
| `created_at` | TIMESTAMPTZ | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | Última actualización |

### Tabla: `mensajes`
Almacena los mensajes del chat en tiempo real.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID (PK) | ID único |
| `user_id` | UUID (FK) | Referencia a `perfiles.id` |
| `content` | TEXT | Contenido del mensaje |
| `created_at` | TIMESTAMPTZ | Fecha de envío |

---

## 🔐 Políticas RLS (Row Level Security)

### Perfiles
- ✅ **SELECT**: Público (todos pueden ver perfiles)
- ✅ **UPDATE**: Solo el propietario puede editar su perfil

### Puntuaciones
- ✅ **SELECT**: Público (para mostrar ranking)
- ✅ **INSERT**: Usuario autenticado (su propio user_id)
- ✅ **UPDATE**: Solo el propietario

### Mensajes
- ✅ **SELECT**: Público (chat visible para todos)
- ✅ **INSERT**: Usuario autenticado

---

## 📦 Storage - Bucket `avatars`

Configuración del bucket para almacenar avatares de usuarios.

```toml
[storage.buckets.avatars]
public = true
file_size_limit = "5MiB"
allowed_mime_types = ["image/png", "image/jpeg", "image/gif", "image/webp"]
```

### Estructura de Archivos
```
avatars/
└── {user_id}/
    └── avatar.{ext}
```

---

## 🔄 Realtime

Las siguientes tablas tienen Realtime habilitado:

| Tabla | Eventos |
|-------|---------|
| `puntuaciones` | INSERT, UPDATE, DELETE |
| `mensajes` | INSERT, UPDATE, DELETE |

### Ejemplo de Suscripción

```javascript
const channel = supabase
  .channel('public:puntuaciones')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'puntuaciones' }, 
    (payload) => console.log('Cambio en ranking:', payload)
  )
  .subscribe();
```

---

## ⚡ Trigger: Creación Automática de Perfil

Cuando un usuario se registra, se crea automáticamente su perfil:

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

La función toma el `username` de los metadatos del usuario o usa "Anónimo" por defecto.

---

## 🧪 Comandos Útiles

```bash
# Iniciar Supabase
npm run supabase:start

# Ver estado
npm run supabase:status

# Detener
npm run supabase:stop

# Resetear base de datos
npm run supabase:db:reset

# Ver logs
npx supabase db logs
```

---

## 🔑 Credenciales de Desarrollo

| Key | Valor |
|-----|-------|
| **ANON_KEY** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0` |
| **SERVICE_ROLE_KEY** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU` |
| **DB Password** | `postgres` |

> ⚠️ Estas credenciales son solo para desarrollo local. **NUNCA** usar en producción.
