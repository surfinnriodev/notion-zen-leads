-- Adicionar coluna para faixas de preço das aulas de surf
ALTER TABLE pricing_config 
ADD COLUMN IF NOT EXISTS surf_lesson_pricing JSONB DEFAULT '{
  "tier1": 180,
  "tier2": 160, 
  "tier3": 140
}';

-- Remover item "Aula de Surf" duplicado da configuração padrão
UPDATE pricing_config 
SET items = (
  SELECT jsonb_agg(item)
  FROM jsonb_array_elements(items) AS item
  WHERE item->>'id' != 'surf-lesson'
)
WHERE items @> '[{"id": "surf-lesson"}]';

-- Atualizar configuração padrão com faixas de preço das aulas de surf
UPDATE pricing_config 
SET surf_lesson_pricing = '{
  "tier1": 180,
  "tier2": 160,
  "tier3": 140
}'::jsonb
WHERE surf_lesson_pricing IS NULL;
