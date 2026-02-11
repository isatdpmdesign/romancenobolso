-- ============================================
-- Liberação gradual de capítulos (séries em andamento)
-- Execute no Supabase SQL Editor se ainda não tiver essas colunas
-- ============================================

ALTER TABLE livros
  ADD COLUMN IF NOT EXISTS serie_em_andamento BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS proximo_capitulo_em DATE,
  ADD COLUMN IF NOT EXISTS cronograma_texto TEXT;

COMMENT ON COLUMN livros.serie_em_andamento IS 'Se true, exibe aviso de próximo capítulo e permite banner na home';
COMMENT ON COLUMN livros.proximo_capitulo_em IS 'Data prevista do próximo capítulo (ex: 2025-02-05)';
COMMENT ON COLUMN livros.cronograma_texto IS 'Texto exibido para o leitor (ex: Novos capítulos segundas e quartas)';
