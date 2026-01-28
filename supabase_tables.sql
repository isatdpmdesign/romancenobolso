-- ============================================
-- SQL para criar tabelas do Romance no Bolso
-- Execute este script no Supabase SQL Editor
-- ============================================

-- 1. Tabela: notification
CREATE TABLE IF NOT EXISTS notification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    type TEXT NOT NULL, -- 'comment_reply', 'new_book', 'book_coming_soon', 'support_response'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    related_id TEXT -- ID relacionado (ex: book_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notification_user_email ON notification(user_email);
CREATE INDEX IF NOT EXISTS idx_notification_is_read ON notification(is_read);
CREATE INDEX IF NOT EXISTS idx_notification_created_date ON notification(created_date DESC);

-- 2. Tabela: comment
CREATE TABLE IF NOT EXISTS comment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id TEXT NOT NULL,
    book_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    parent_id UUID REFERENCES comment(id) ON DELETE CASCADE, -- Para respostas
    created_date TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_comment_chapter_id ON comment(chapter_id);
CREATE INDEX IF NOT EXISTS idx_comment_book_id ON comment(book_id);
CREATE INDEX IF NOT EXISTS idx_comment_status ON comment(status);
CREATE INDEX IF NOT EXISTS idx_comment_parent_id ON comment(parent_id);
CREATE INDEX IF NOT EXISTS idx_comment_created_date ON comment(created_date DESC);

-- 3. Tabela: purchase
CREATE TABLE IF NOT EXISTS purchase (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    book_id TEXT NOT NULL,
    payment_method TEXT NOT NULL, -- 'credit_card', 'pix', etc.
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_purchase_user_email ON purchase(user_email);
CREATE INDEX IF NOT EXISTS idx_purchase_book_id ON purchase(book_id);
CREATE INDEX IF NOT EXISTS idx_purchase_status ON purchase(status);
CREATE INDEX IF NOT EXISTS idx_purchase_user_book ON purchase(user_email, book_id);

-- 4. Tabela: book_interest
CREATE TABLE IF NOT EXISTS book_interest (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_name TEXT,
    notified BOOLEAN DEFAULT false, -- Se já foi notificado sobre o lançamento
    created_date TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(book_id, user_email) -- Evita duplicatas
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_book_interest_book_id ON book_interest(book_id);
CREATE INDEX IF NOT EXISTS idx_book_interest_user_email ON book_interest(user_email);
CREATE INDEX IF NOT EXISTS idx_book_interest_notified ON book_interest(notified);

-- ============================================
-- RLS (Row Level Security) Policies
-- ============================================

-- Habilitar RLS nas tabelas
ALTER TABLE notification ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_interest ENABLE ROW LEVEL SECURITY;

-- Policies para notification
CREATE POLICY "Users can view their own notifications"
    ON notification FOR SELECT
    USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can update their own notifications"
    ON notification FOR UPDATE
    USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can delete their own notifications"
    ON notification FOR DELETE
    USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Service role can insert notifications"
    ON notification FOR INSERT
    WITH CHECK (true);

-- Policies para comment
CREATE POLICY "Anyone can view approved comments"
    ON comment FOR SELECT
    USING (status = 'approved');

CREATE POLICY "Users can insert their own comments"
    ON comment FOR INSERT
    WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- Policies para purchase
CREATE POLICY "Users can view their own purchases"
    ON purchase FOR SELECT
    USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Service role can insert purchases"
    ON purchase FOR INSERT
    WITH CHECK (true);

-- Policies para book_interest
CREATE POLICY "Users can view their own interests"
    ON book_interest FOR SELECT
    USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can insert their own interests"
    ON book_interest FOR INSERT
    WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can update their own interests"
    ON book_interest FOR UPDATE
    USING (auth.jwt() ->> 'email' = user_email);

-- 5. Tabela: user_progress (Progresso de Leitura)
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id TEXT NOT NULL,
    last_chapter_id TEXT NOT NULL,
    progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, book_id) -- Um registro por usuário por livro
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_book_id ON user_progress(book_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_updated_at ON user_progress(updated_at DESC);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_user_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_progress_updated_at
    BEFORE UPDATE ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_user_progress_updated_at();

-- RLS (Row Level Security) para user_progress
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Policies para user_progress
CREATE POLICY "Users can view their own progress"
    ON user_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
    ON user_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
    ON user_progress FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress"
    ON user_progress FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- Comentários sobre buckets de storage
-- ============================================
-- 
-- Certifique-se de criar os seguintes buckets no Supabase Storage:
-- 1. 'images' - Para imagens do carousel (CarouselItemEditor.jsx)
-- 2. 'capas' - Para capas de livros vertical e hero (Admin.jsx, ManageChapters.jsx)
-- 3. 'avatars' - Para avatares de usuários (Profile.jsx)
-- 4. 'audios' - Para áudios de capítulos (ManageChapters.jsx)
-- 
-- Configurações recomendadas:
-- - Public: true (para imagens e áudios públicos)
-- - File size limit: 
--   * Imagens: 5MB
--   * Áudios: 50MB
-- - Allowed MIME types: 
--   * images: image/*
--   * audios: audio/*
