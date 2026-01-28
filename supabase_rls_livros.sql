-- ============================================
-- RLS Policies para a tabela LIVROS
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Verificar se RLS está habilitado (se não estiver, habilitar)
ALTER TABLE livros ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem (para evitar conflitos)
DROP POLICY IF EXISTS "Public can view published books" ON livros;
DROP POLICY IF EXISTS "Admins can view all books" ON livros;
DROP POLICY IF EXISTS "Admins can insert books" ON livros;
DROP POLICY IF EXISTS "Admins can update books" ON livros;
DROP POLICY IF EXISTS "Admins can delete books" ON livros;

-- 1. POLÍTICA PÚBLICA: Qualquer pessoa (logada ou não) pode VER livros publicados ou "em breve"
CREATE POLICY "Public can view published books"
    ON livros FOR SELECT
    USING (status IN ('published', 'coming_soon'));

-- 2. POLÍTICA PARA ADMINS: Admins podem ver TODOS os livros (incluindo rascunhos)
-- Nota: Esta política assume que você tem uma função ou coluna que identifica admins
-- Se você usa uma tabela de usuários ou metadata, ajuste a condição abaixo
CREATE POLICY "Admins can view all books"
    ON livros FOR SELECT
    USING (
        -- Se você tem uma coluna 'is_admin' na tabela auth.users ou uma tabela de permissões:
        -- EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'is_admin' = 'true')
        -- OU se você usa uma tabela separada de admins:
        -- EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
        -- Por enquanto, vamos permitir que qualquer usuário autenticado veja rascunhos
        -- (você pode ajustar isso depois baseado na sua lógica de admin)
        auth.uid() IS NOT NULL
    );

-- 3. POLÍTICA PARA ADMINS: Admins podem INSERIR livros
CREATE POLICY "Admins can insert books"
    ON livros FOR INSERT
    WITH CHECK (
        -- Ajuste conforme sua lógica de admin
        auth.uid() IS NOT NULL
    );

-- 4. POLÍTICA PARA ADMINS: Admins podem ATUALIZAR livros
CREATE POLICY "Admins can update books"
    ON livros FOR UPDATE
    USING (
        -- Ajuste conforme sua lógica de admin
        auth.uid() IS NOT NULL
    )
    WITH CHECK (
        -- Ajuste conforme sua lógica de admin
        auth.uid() IS NOT NULL
    );

-- 5. POLÍTICA PARA ADMINS: Admins podem DELETAR livros
CREATE POLICY "Admins can delete books"
    ON livros FOR DELETE
    USING (
        -- Ajuste conforme sua lógica de admin
        auth.uid() IS NOT NULL
    );

-- ============================================
-- NOTA IMPORTANTE:
-- ============================================
-- As políticas acima permitem que QUALQUER usuário autenticado veja/edite livros.
-- Se você tem uma lógica específica para identificar admins (ex: tabela de permissões,
-- metadata no auth.users, etc.), ajuste as condições USING/WITH CHECK acima.
--
-- Exemplo de como verificar se um usuário é admin usando metadata:
-- USING (auth.jwt() ->> 'is_admin' = 'true')
--
-- Ou usando uma tabela separada:
-- USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
