-- =============================================
-- Snake Classic - Tablas para Modo Multijugador
-- =============================================

-- ===== TABLA: SALAS =====
-- Almacena las salas de juego activas y su estado
CREATE TABLE salas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL,           -- Código para unirse (ej: ABC123)
  mode VARCHAR(20) NOT NULL DEFAULT 'duel',  -- 'duel' o 'points'
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'waiting',      -- waiting, countdown, playing, finished
  max_players INTEGER DEFAULT 2,
  current_round INTEGER DEFAULT 1,
  total_rounds INTEGER DEFAULT 3,            -- Para duelos best-of-X
  game_config JSONB DEFAULT '{}',            -- Configuración adicional
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

-- Índices para búsqueda rápida
CREATE INDEX idx_salas_code ON salas(code);
CREATE INDEX idx_salas_status ON salas(status);
CREATE INDEX idx_salas_host ON salas(host_id);

-- ===== TABLA: JUGADORES_SALA =====
-- Relación de jugadores en una sala
CREATE TABLE jugadores_sala (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sala_id UUID NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_number INTEGER NOT NULL,            -- 1, 2, 3, 4
  is_ready BOOLEAN DEFAULT false,
  is_alive BOOLEAN DEFAULT true,             -- Para tracking durante partida
  current_score INTEGER DEFAULT 0,
  rounds_won INTEGER DEFAULT 0,
  color VARCHAR(7) DEFAULT '#00FFFF',        -- Color de la serpiente
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sala_id, user_id),
  UNIQUE(sala_id, player_number)
);

-- Índices
CREATE INDEX idx_jugadores_sala_id ON jugadores_sala(sala_id);
CREATE INDEX idx_jugadores_user_id ON jugadores_sala(user_id);

-- ===== TABLA: PARTIDAS_MULTIJUGADOR =====
-- Historial de partidas completadas
CREATE TABLE partidas_multijugador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sala_id UUID REFERENCES salas(id) ON DELETE SET NULL,
  mode VARCHAR(20) NOT NULL,
  duration_seconds INTEGER,
  winner_id UUID REFERENCES auth.users(id),
  total_players INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para historial del jugador
CREATE INDEX idx_partidas_winner ON partidas_multijugador(winner_id);

-- ===== TABLA: RESULTADOS_PARTIDA =====
-- Resultados individuales por partida
CREATE TABLE resultados_partida (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partida_id UUID NOT NULL REFERENCES partidas_multijugador(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,                 -- 1ro, 2do, 3ro, 4to
  final_score INTEGER DEFAULT 0,
  rounds_won INTEGER DEFAULT 0,
  max_length INTEGER DEFAULT 0,              -- Longitud máxima alcanzada
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partida_id, user_id)
);

-- Índice para historial del jugador
CREATE INDEX idx_resultados_user ON resultados_partida(user_id);

-- ===== HABILITAR REALTIME =====
-- Necesario para sincronización en tiempo real
ALTER PUBLICATION supabase_realtime ADD TABLE salas;
ALTER PUBLICATION supabase_realtime ADD TABLE jugadores_sala;

-- ===== FUNCIÓN: GENERAR CÓDIGO ÚNICO =====
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS VARCHAR(6) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- Sin I, O, 0, 1 para evitar confusión
  result VARCHAR(6) := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ===== TRIGGER: AUTO-GENERAR CÓDIGO AL CREAR SALA =====
CREATE OR REPLACE FUNCTION set_room_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code VARCHAR(6);
  attempts INTEGER := 0;
BEGIN
  -- Generar código único (máximo 10 intentos)
  LOOP
    new_code := generate_room_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM salas WHERE code = new_code);
    attempts := attempts + 1;
    IF attempts > 10 THEN
      RAISE EXCEPTION 'No se pudo generar código único';
    END IF;
  END LOOP;
  
  NEW.code := new_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_room_code
  BEFORE INSERT ON salas
  FOR EACH ROW
  WHEN (NEW.code IS NULL)
  EXECUTE FUNCTION set_room_code();

-- ===== TRIGGER: ASIGNAR NÚMERO DE JUGADOR =====
CREATE OR REPLACE FUNCTION assign_player_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Encontrar el siguiente número disponible
  SELECT COALESCE(MAX(player_number), 0) + 1 INTO next_number
  FROM jugadores_sala
  WHERE sala_id = NEW.sala_id;
  
  NEW.player_number := next_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assign_player_number
  BEFORE INSERT ON jugadores_sala
  FOR EACH ROW
  WHEN (NEW.player_number IS NULL)
  EXECUTE FUNCTION assign_player_number();

-- ===== FUNCIÓN: LIMPIAR SALAS ANTIGUAS =====
-- Eliminar salas inactivas después de 1 hora
CREATE OR REPLACE FUNCTION cleanup_old_rooms()
RETURNS void AS $$
BEGIN
  DELETE FROM salas 
  WHERE (status = 'waiting' AND created_at < NOW() - INTERVAL '1 hour')
     OR (status = 'finished' AND finished_at < NOW() - INTERVAL '30 minutes');
END;
$$ LANGUAGE plpgsql;
