-- ============================================
-- RLS Policies para a tabela CAPITULOS
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Verificar se RLS está habilitado (se não estiver, habilitar)
ALTER TABLE capitulos ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem (para evitar conflitos)
DROP POLICY IF EXISTS "Public can view chapters" ON capitulos;
DROP POLICY IF EXISTS "Admins can manage chapters" ON capitulos;

-- 1. POLÍTICA PÚBLICA: Qualquer pessoa pode VER capítulos (para contar e mostrar na Home)
CREATE POLICY "Public can view chapters"
    ON capitulos FOR SELECT
    USING (true); -- Todos podem ver capítulos (eles são públicos)

-- 2. POLÍTICA PARA ADMINS: Admins podem gerenciar capítulos
CREATE POLICY "Admins can manage chapters"
    ON capitulos FOR ALL
    USING (
        -- Ajuste conforme sua lógica de admin
        auth.uid() IS NOT NULL
    )
    WITH CHECK (
        -- Ajuste conforme sua lógica de admin
        auth.uid() IS NOT NULL
    );
