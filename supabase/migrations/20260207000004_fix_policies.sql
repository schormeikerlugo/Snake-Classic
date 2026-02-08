-- =============================================
-- Snake Classic - Corrección de Políticas RLS
-- =============================================

-- Agregar política INSERT para perfiles (para el trigger de auto-creación)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'perfiles' 
        AND policyname = 'Sistema crea perfiles'
    ) THEN
        CREATE POLICY "Sistema crea perfiles" 
          ON perfiles FOR INSERT 
          WITH CHECK (true);
    END IF;
END $$;
