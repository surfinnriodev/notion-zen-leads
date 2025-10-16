-- Corrigir IDs dos itens para consistência com o código
-- Os códigos esperam IDs que correspondem aos campos do banco de dados

-- Corrigir análise de vídeo: 'video-analysis' -> 'analise_de_video'
UPDATE pricing_config
SET items = jsonb_set(
  items,
  '{4,id}',
  '"analise_de_video"'
)
WHERE is_active = true
AND items->4->>'id' = 'video-analysis'
AND items->4->>'name' = 'Análise de Vídeo';

-- Corrigir surf-skate: 'surf-skate' -> 'skate'
UPDATE pricing_config
SET items = jsonb_set(
  items,
  '{3,id}',
  '"skate"'
)
WHERE is_active = true
AND items->3->>'id' = 'surf-skate'
AND items->3->>'name' = 'Surf-skate';

-- Corrigir surf guide: 'surf-guide' -> 'surf_guide'
UPDATE pricing_config
SET items = jsonb_set(
  items,
  '{8,id}',
  '"surf_guide"'
)
WHERE is_active = true
AND items->8->>'id' = 'surf-guide'
AND items->8->>'name' = 'Surf guide';

-- Comentário explicativo
COMMENT ON TABLE pricing_config IS 'Configuração de preços do sistema. IDs dos itens devem corresponder aos campos do banco de dados.';
