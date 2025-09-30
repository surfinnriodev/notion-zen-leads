-- Script para executar todas as migrações
-- Execute este script no SQL Editor do Supabase

-- 1. Criar tabela de configuração de preços
\i migrations/001_create_pricing_config.sql

-- 2. Criar tabela de templates de mensagens  
\i migrations/002_create_message_templates.sql

-- 3. Criar tabela de histórico de mensagens
\i migrations/003_create_message_history.sql

-- 4. Adicionar campos de categoria de quarto e ajustes de preço
\i migrations/005_add_room_fields_and_pricing_overrides.sql

-- 5. Atualizar tipos de quarto completos na configuração
\i migrations/006_update_room_categories_complete.sql

-- 6. Corrigir nomenclatura de tipos de quarto nos leads existentes
\i migrations/007_fix_room_type_nomenclature.sql

-- Verificar se as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('pricing_config', 'message_templates', 'message_history')
ORDER BY table_name;
