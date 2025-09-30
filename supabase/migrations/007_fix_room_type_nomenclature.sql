-- Corrigir nomenclatura de tipos de quarto nos leads existentes
-- Esta migração padroniza todos os nomes de quartos para o formato correto

-- 1. Corrigir "Shared: Economía mixta" para "Shared: Mixed Economic"
UPDATE reservations
SET tipo_de_quarto = 'Shared: Mixed Economic',
    room_category = 'Shared',
    room_type = 'Mixed Economic'
WHERE tipo_de_quarto = 'Shared: Economía mixta';

-- 2. Corrigir "undefined: Private" para remover (sem quarto)
UPDATE reservations
SET tipo_de_quarto = NULL,
    room_category = 'Without Room',
    room_type = NULL
WHERE tipo_de_quarto LIKE 'undefined:%';

-- 3. Corrigir "Without Room: " (com espaço) para "Without room"
UPDATE reservations
SET tipo_de_quarto = 'Without room',
    room_category = 'Without Room',
    room_type = NULL
WHERE tipo_de_quarto LIKE 'Without Room:%' OR tipo_de_quarto LIKE 'Without room:%';

-- 4. Corrigir "Shared: Female with A/C" para "Shared: Female Standard"
UPDATE reservations
SET tipo_de_quarto = 'Shared: Female Standard',
    room_category = 'Shared',
    room_type = 'Female Standard'
WHERE tipo_de_quarto = 'Shared: Female with A/C';

-- 5. Corrigir "Suítes (pré reservado) - Pontal" para "Private: Sea-View"
UPDATE reservations
SET tipo_de_quarto = 'Private: Sea-View',
    room_category = 'Private',
    room_type = 'Sea-View'
WHERE tipo_de_quarto LIKE 'Suítes%' OR tipo_de_quarto LIKE '%Pontal%';

-- 6. Corrigir "Private: A/C + Private bathroom" para "Private: Double"
UPDATE reservations
SET tipo_de_quarto = 'Private: Double',
    room_category = 'Private',
    room_type = 'Double'
WHERE tipo_de_quarto LIKE 'Private: A/C%' OR tipo_de_quarto LIKE '%Private bathroom%';

-- 7. Corrigir "Shared: Standard (A/C)" para "Shared: Mixed Standard"
UPDATE reservations
SET tipo_de_quarto = 'Shared: Mixed Standard',
    room_category = 'Shared',
    room_type = 'Mixed Standard'
WHERE tipo_de_quarto = 'Shared: Standard (A/C)' OR tipo_de_quarto = 'Shared: Standard';

-- 8. Corrigir "Shared: Economic" (sem especificar Mixed/Female) para "Shared: Mixed Economic"
UPDATE reservations
SET tipo_de_quarto = 'Shared: Mixed Economic',
    room_category = 'Shared',
    room_type = 'Mixed Economic'
WHERE tipo_de_quarto = 'Shared: Economic';

-- 9. Preencher room_category e room_type para quartos que já estão corretos mas não têm os campos novos
UPDATE reservations
SET room_category = 'Private',
    room_type = TRIM(SUBSTRING(tipo_de_quarto FROM 9))
WHERE tipo_de_quarto LIKE 'Private:%' 
  AND (room_category IS NULL OR room_category = '');

UPDATE reservations
SET room_category = 'Shared',
    room_type = TRIM(SUBSTRING(tipo_de_quarto FROM 8))
WHERE tipo_de_quarto LIKE 'Shared:%' 
  AND (room_category IS NULL OR room_category = '');

-- 10. Padronizar "Without room" vs "Without Room"
UPDATE reservations
SET tipo_de_quarto = 'Without room',
    room_category = 'Without Room',
    room_type = NULL
WHERE LOWER(tipo_de_quarto) = 'without room' 
  OR tipo_de_quarto = 'Without Room';

-- Relatório de correções
SELECT 
  'Total de registros corrigidos' as descricao,
  COUNT(*) as quantidade
FROM reservations
WHERE room_category IS NOT NULL;

-- Listar tipos de quarto únicos após correção
SELECT 
  tipo_de_quarto,
  room_category,
  room_type,
  COUNT(*) as quantidade
FROM reservations
WHERE tipo_de_quarto IS NOT NULL
GROUP BY tipo_de_quarto, room_category, room_type
ORDER BY room_category, room_type;

