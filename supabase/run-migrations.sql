-- Script para executar todas as migrações
-- Execute este script no SQL Editor do Supabase

-- 1. Criar tabela de configuração de preços
\i migrations/001_create_pricing_config.sql

-- 2. Criar tabela de templates de mensagens  
\i migrations/002_create_message_templates.sql

-- 3. Criar tabela de histórico de mensagens
\i migrations/003_create_message_history.sql

-- Verificar se as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('pricing_config', 'message_templates', 'message_history')
ORDER BY table_name;
