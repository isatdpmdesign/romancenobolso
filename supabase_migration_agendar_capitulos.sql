-- ============================================
-- Agendamento de publicação de capítulos
-- Execute no Supabase SQL Editor
-- ============================================

-- Coluna: quando não nula, o capítulo está publicado e visível para leitores
ALTER TABLE capitulos
  ADD COLUMN IF NOT EXISTS publicado_em TIMESTAMPTZ DEFAULT NULL;

-- Coluna: quando preenchida, o sistema publica o capítulo nesta data/hora (via cron + Edge Function)
ALTER TABLE capitulos
  ADD COLUMN IF NOT EXISTS agendado_para TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN capitulos.publicado_em IS 'Data/hora em que o capítulo foi publicado. Se NULL, não aparece no Reader/BookDetails (rascunho ou agendado).';
COMMENT ON COLUMN capitulos.agendado_para IS 'Data/hora em que o capítulo deve ser publicado automaticamente. A Edge Function publish-scheduled-chapters processa isso.';

-- Deixar todos os capítulos existentes publicados (comportamento atual)
UPDATE capitulos
SET publicado_em = NOW()
WHERE publicado_em IS NULL;
