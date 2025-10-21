-- Adicionar coluna origem na tabela reservations
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS origem TEXT;