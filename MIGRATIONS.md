# 🗄️ Migrações do Banco de Dados

Este documento explica como executar as migrações para criar as tabelas necessárias para persistir os dados da calculadora e mensagens.

## 📋 Tabelas a Criar

1. **`pricing_config`** - Configurações de preços
2. **`message_templates`** - Templates de mensagens
3. **`message_history`** - Histórico de mensagens enviadas

## 🚀 Como Executar as Migrações

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para o seu projeto
3. Clique em **SQL Editor**
4. Execute cada arquivo de migração na ordem:

```sql
-- 1. Primeiro execute: migrations/001_create_pricing_config.sql
-- 2. Depois execute: migrations/002_create_message_templates.sql  
-- 3. Por último execute: migrations/003_create_message_history.sql
```

### Opção 2: Via CLI do Supabase

```bash
# Instalar CLI do Supabase (se não tiver)
npm install -g supabase

# Fazer login
supabase login

# Linkar ao projeto
supabase link --project-ref SEU_PROJECT_REF

# Executar migrações
supabase db push
```

### Opção 3: Executar Script Completo

Execute o arquivo `supabase/run-migrations.sql` no SQL Editor do Supabase.

## ✅ Verificar se Funcionou

Após executar as migrações, verifique se as tabelas foram criadas:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('pricing_config', 'message_templates', 'message_history')
ORDER BY table_name;
```

## 📊 Dados Iniciais

As migrações incluem dados iniciais:

- **Configuração padrão de preços** com quartos, pacotes e itens
- **5 templates de mensagem** pré-definidos:
  - Mensagem de Boas-vindas
  - Confirmação de Reserva
  - Follow-up 1
  - Orçamento Enviado
  - Link de Pagamento

## 🔧 Funcionalidades Após Migração

Após executar as migrações, você terá:

- ✅ **Persistência de configurações de preços** no banco
- ✅ **Templates de mensagem** salvos no Supabase
- ✅ **Histórico de mensagens** enviadas para cada lead
- ✅ **Sincronização automática** entre dispositivos
- ✅ **Backup automático** dos dados

## 🚨 Troubleshooting

### Erro: "relation does not exist"
- Verifique se executou as migrações na ordem correta
- Confirme se está no schema `public`

### Erro: "permission denied"
- Verifique se tem permissões de administrador no projeto
- Use o SQL Editor do Supabase Dashboard

### Dados não aparecem
- Verifique se as tabelas foram criadas
- Confirme se os dados iniciais foram inseridos
- Verifique os logs do Supabase

## 📞 Suporte

Se encontrar problemas, verifique:
1. Logs do Supabase Dashboard
2. Console do navegador para erros
3. Network tab para requisições falhando
