-- =============================================
-- Snake Classic - Esquema Inicial de Base de Datos
-- =============================================

-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de puntuaciones
CREATE TABLE IF NOT EXISTS puntuaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES perfiles(id) ON DELETE CASCADE,
  best_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de mensajes del chat
CREATE TABLE IF NOT EXISTS mensajes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES perfiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Realtime para las tablas
ALTER PUBLICATION supabase_realtime ADD TABLE puntuaciones;
ALTER PUBLICATION supabase_realtime ADD TABLE mensajes;

-- Comentarios para documentación
COMMENT ON TABLE perfiles IS 'Perfiles de usuarios del juego Snake Classic';
COMMENT ON TABLE puntuaciones IS 'Mejores puntuaciones de cada jugador';
COMMENT ON TABLE mensajes IS 'Mensajes del chat en tiempo real';
