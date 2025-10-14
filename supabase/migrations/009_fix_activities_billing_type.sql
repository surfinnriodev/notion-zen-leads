-- Corrigir billingType das atividades para considerar número de pessoas
-- Hike, Rio City Tour e Carioca Experience devem ser cobradas por pessoa, não por reserva

UPDATE pricing_config
SET items = jsonb_set(
  jsonb_set(
    jsonb_set(
      items,
      '{5,billingType}',
      '"per_person"'
    ),
    '{6,billingType}',
    '"per_person"'
  ),
  '{7,billingType}',
  '"per_person"'
)
WHERE is_active = true
AND items->5->>'id' = 'hike'
AND items->6->>'id' = 'rio-city-tour'
AND items->7->>'id' = 'carioca-experience';

-- Comentário explicativo
COMMENT ON TABLE pricing_config IS 'Configuração de preços do sistema. Atividades como Trilha, Rio City Tour e Carioca Experience são cobradas por pessoa (per_person).';

