-- =============================================
-- Snake Classic - Políticas RLS para Multijugador
-- =============================================

-- ===== HABILITAR RLS =====
ALTER TABLE salas ENABLE ROW LEVEL SECURITY;
ALTER TABLE jugadores_sala ENABLE ROW LEVEL SECURITY;
ALTER TABLE partidas_multijugador ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados_partida ENABLE ROW LEVEL SECURITY;

-- ===== POLÍTICAS: SALAS =====

-- Todos los usuarios autenticados pueden ver salas activas
CREATE POLICY "Salas públicas para lectura"
  ON salas FOR SELECT
  USING (status IN ('waiting', 'countdown', 'playing'));

-- Usuarios autenticados pueden crear salas
CREATE POLICY "Usuarios crean salas"
  ON salas FOR INSERT
  WITH CHECK (auth.uid() = host_id);

-- Solo el host puede actualizar su sala
CREATE POLICY "Host actualiza sala"
  ON salas FOR UPDATE
  USING (auth.uid() = host_id);

-- Solo el host puede eliminar su sala
CREATE POLICY "Host elimina sala"
  ON salas FOR DELETE
  USING (auth.uid() = host_id);

-- ===== POLÍTICAS: JUGADORES_SALA =====

-- Todos pueden ver los jugadores de una sala
CREATE POLICY "Jugadores visibles"
  ON jugadores_sala FOR SELECT
  USING (true);

-- Usuarios autenticados pueden unirse a salas
CREATE POLICY "Usuarios se unen a salas"
  ON jugadores_sala FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Jugadores pueden actualizar su propio estado (ready, score, etc.)
CREATE POLICY "Jugadores actualizan su estado"
  ON jugadores_sala FOR UPDATE
  USING (auth.uid() = user_id);

-- Jugadores pueden salir de salas (eliminar su registro)
CREATE POLICY "Jugadores salen de salas"
  ON jugadores_sala FOR DELETE
  USING (auth.uid() = user_id);

-- Host puede eliminar jugadores de su sala
CREATE POLICY "Host puede expulsar jugadores"
  ON jugadores_sala FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM salas 
      WHERE salas.id = jugadores_sala.sala_id 
      AND salas.host_id = auth.uid()
    )
  );

-- ===== POLÍTICAS: PARTIDAS_MULTIJUGADOR =====

-- Todos pueden ver el historial de partidas
CREATE POLICY "Historial público"
  ON partidas_multijugador FOR SELECT
  USING (true);

-- El sistema (a través del host) puede crear partidas
CREATE POLICY "Crear partida desde sala"
  ON partidas_multijugador FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM salas 
      WHERE salas.id = partidas_multijugador.sala_id 
      AND salas.host_id = auth.uid()
    )
  );

-- ===== POLÍTICAS: RESULTADOS_PARTIDA =====

-- Todos pueden ver resultados
CREATE POLICY "Resultados públicos"
  ON resultados_partida FOR SELECT
  USING (true);

-- El sistema puede crear resultados (a través de participantes)
CREATE POLICY "Crear resultado propio"
  ON resultados_partida FOR INSERT
  WITH CHECK (auth.uid() = user_id);
