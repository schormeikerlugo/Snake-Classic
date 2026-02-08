-- =============================================
-- Snake Classic - Políticas de Storage para Avatars
-- =============================================

-- Política para que usuarios puedan INSERTAR (subir) avatares a su carpeta
CREATE POLICY "Usuarios suben sus avatares" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política para que usuarios puedan ACTUALIZAR sus avatares
CREATE POLICY "Usuarios actualizan sus avatares" 
  ON storage.objects FOR UPDATE 
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política para que usuarios puedan ELIMINAR sus avatares
CREATE POLICY "Usuarios eliminan sus avatares" 
  ON storage.objects FOR DELETE 
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política para lectura pública de avatares (el bucket ya es público)
CREATE POLICY "Avatares son públicos para lectura" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'avatars');
