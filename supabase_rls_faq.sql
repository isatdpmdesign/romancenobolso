-- ============================================
-- SQL para criar tabela FAQ e políticas RLS
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Tabela: faq
CREATE TABLE IF NOT EXISTS faq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'geral', -- 'geral', 'pagamento', 'conta', 'leitura', 'tecnico'
    "order" INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_faq_category ON faq(category);
CREATE INDEX IF NOT EXISTS idx_faq_is_active ON faq(is_active);
CREATE INDEX IF NOT EXISTS idx_faq_order ON faq("order");

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_faq_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_faq_updated_at
    BEFORE UPDATE ON faq
    FOR EACH ROW
    EXECUTE FUNCTION update_faq_updated_at();

-- RLS (Row Level Security) para faq
ALTER TABLE faq ENABLE ROW LEVEL SECURITY;

-- Policies para faq
-- Qualquer pessoa pode visualizar FAQs ativas
CREATE POLICY "Anyone can view active FAQs"
    ON faq FOR SELECT
    USING (is_active = true);

-- Apenas admins podem inserir, atualizar e deletar FAQs
-- Nota: Ajuste o email conforme necessário ou use uma função de verificação de admin
CREATE POLICY "Admins can manage FAQs"
    ON faq FOR ALL
    USING (
        auth.jwt() ->> 'email' = 'isaduarte.design@gmail.com'
    )
    WITH CHECK (
        auth.jwt() ->> 'email' = 'isaduarte.design@gmail.com'
    );
