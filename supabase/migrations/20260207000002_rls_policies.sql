-- =============================================
-- Snake Classic - Políticas de Row Level Security
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE puntuaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes ENABLE ROW LEVEL SECURITY;

-- ===== PERFILES =====
-- Todos pueden leer perfiles (público para ranking y chat)
CREATE POLICY "Perfiles públicos para lectura" 
  ON perfiles FOR SELECT 
  USING (true);

-- Solo el dueño puede actualizar su perfil
CREATE POLICY "Usuarios editan su propio perfil" 
  ON perfiles FOR UPDATE 
  USING (auth.uid() = id);

-- ===== PUNTUACIONES =====
-- Todos pueden ver puntuaciones (para ranking)
CREATE POLICY "Puntuaciones públicas para lectura" 
  ON puntuaciones FOR SELECT 
  USING (true);

-- Usuarios autenticados pueden insertar sus puntuaciones
CREATE POLICY "Usuarios insertan sus puntuaciones" 
  ON puntuaciones FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Usuarios pueden actualizar solo sus propias puntuaciones
CREATE POLICY "Usuarios actualizan sus puntuaciones" 
  ON puntuaciones FOR UPDATE 
  USING (auth.uid() = user_id);

-- ===== MENSAJES =====
-- Todos pueden leer mensajes (chat público)
CREATE POLICY "Mensajes públicos para lectura" 
  ON mensajes FOR SELECT 
  USING (true);

-- Usuarios autenticados pueden enviar mensajes
CREATE POLICY "Usuarios autenticados envían mensajes" 
  ON mensajes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
