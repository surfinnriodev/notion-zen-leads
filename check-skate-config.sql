-- Script para verificar e corrigir a configuração do surf skate
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se o item 'skate' existe na configuração
SELECT 
  id,
  name,
  is_active,
  items
FROM pricing_config 
WHERE is_active = true;

-- 2. Verificar especificamente o item 'skate' (método correto)
SELECT 
  item
FROM pricing_config,
  jsonb_array_elements(items) as item
WHERE is_active = true
AND item->>'id' = 'skate';

-- 3. Se o item não existir, adicionar o item 'skate' à configuração
UPDATE pricing_config
SET items = items || '[
  {
    "id": "skate",
    "name": "Surf-skate",
    "price": 160,
    "billingType": "per_person",
    "category": "fixed",
    "dbColumn": "skate"
  }
]'::jsonb
WHERE is_active = true
AND NOT EXISTS (
  SELECT 1 
  FROM jsonb_array_elements(items) as item
  WHERE item->>'id' = 'skate'
);

-- 4. Verificar se foi adicionado corretamente
SELECT 
  item
FROM pricing_config,
  jsonb_array_elements(items) as item
WHERE is_active = true
AND item->>'id' = 'skate';
