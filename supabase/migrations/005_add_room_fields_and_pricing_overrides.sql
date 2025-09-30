-- Adicionar campos para categorização de quartos e ajustes de preços
ALTER TABLE reservations 
  ADD COLUMN IF NOT EXISTS room_category VARCHAR(50),
  ADD COLUMN IF NOT EXISTS room_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS accommodation_price_override DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS extra_fee_amount DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS extra_fee_description TEXT;

-- Comentários para documentação
COMMENT ON COLUMN reservations.room_category IS 'Categoria do quarto: Private, Shared, Without Room';
COMMENT ON COLUMN reservations.room_type IS 'Tipo específico do quarto: Double, Single, Mixed Standard, etc.';
COMMENT ON COLUMN reservations.accommodation_price_override IS 'Permite sobrescrever o preço calculado da hospedagem';
COMMENT ON COLUMN reservations.extra_fee_amount IS 'Valor de taxa extra a ser adicionada ao total';
COMMENT ON COLUMN reservations.extra_fee_description IS 'Descrição da taxa extra';

-- Migrar dados existentes de tipo_de_quarto para os novos campos
UPDATE reservations
SET 
  room_category = CASE 
    WHEN tipo_de_quarto LIKE 'Private:%' THEN 'Private'
    WHEN tipo_de_quarto LIKE 'Shared:%' THEN 'Shared'
    WHEN tipo_de_quarto = 'Without room' OR tipo_de_quarto = '' THEN 'Without Room'
    ELSE 'Private'
  END,
  room_type = CASE
    WHEN tipo_de_quarto LIKE 'Private: %' THEN TRIM(SUBSTRING(tipo_de_quarto FROM 10))
    WHEN tipo_de_quarto LIKE 'Shared: %' THEN TRIM(SUBSTRING(tipo_de_quarto FROM 9))
    ELSE NULL
  END
WHERE tipo_de_quarto IS NOT NULL AND tipo_de_quarto != '';

