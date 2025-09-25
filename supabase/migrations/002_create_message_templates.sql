-- Tabela para templates de mensagens
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_message_templates_active ON message_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_message_templates_name ON message_templates(name);
CREATE INDEX IF NOT EXISTS idx_message_templates_created_at ON message_templates(created_at);

-- Inserir templates padrão
INSERT INTO message_templates (name, subject, content, variables) VALUES 
(
  'Mensagem de Boas-vindas',
  'Bem-vindo(a) {{nome}}! Sua reserva em análise',
  'Olá {{nome}},

Obrigado pelo seu interesse em nossos serviços de surf!

Detalhes da sua reserva:
• Check-in: {{check_in}}
• Check-out: {{check_out}}
• Número de pessoas: {{numero_pessoas}}
• Tipo de quarto: {{tipo_quarto}}
• Pacote: {{pacote}}

Valor total: {{preco_total}}

Em breve entraremos em contato para finalizar sua reserva.

Abraços,
Equipe Surf Inn Rio',
  ARRAY['nome', 'check_in', 'check_out', 'numero_pessoas', 'tipo_quarto', 'pacote', 'preco_total']
),
(
  'Confirmação de Reserva',
  'Reserva confirmada - {{nome}}',
  'Oi {{nome}}!

Sua reserva foi confirmada! 🏄‍♂️

📅 Período: {{check_in}} até {{check_out}} ({{numero_noites}} noites)
👥 {{numero_pessoas}} pessoa(s)
🏠 {{tipo_quarto}}
📦 {{pacote}}

💰 Valor total: {{preco_total}}

Nos vemos em breve!
Equipe Surf Inn Rio',
  ARRAY['nome', 'check_in', 'check_out', 'numero_noites', 'numero_pessoas', 'tipo_quarto', 'pacote', 'preco_total']
),
(
  'Follow-up 1',
  'Seguindo sua reserva - {{nome}}',
  'Olá {{nome}}!

Esperamos que esteja bem! 

Estamos entrando em contato para saber se tem alguma dúvida sobre sua reserva:

📅 {{check_in}} até {{check_out}}
👥 {{numero_pessoas}} pessoa(s)
🏠 {{tipo_quarto}}
💰 {{preco_total}}

Estamos aqui para ajudar com qualquer questão!

Abraços,
Equipe Surf Inn Rio',
  ARRAY['nome', 'check_in', 'check_out', 'numero_pessoas', 'tipo_quarto', 'preco_total']
),
(
  'Orçamento Enviado',
  'Seu orçamento está pronto - {{nome}}',
  'Oi {{nome}}!

Seu orçamento personalizado está pronto! 📋

Detalhes da sua reserva:
📅 {{check_in}} até {{check_out}} ({{numero_noites}} noites)
👥 {{numero_pessoas}} pessoa(s)
🏠 {{tipo_quarto}}
📦 {{pacote}}

💰 Valor total: {{preco_total}}

Qualquer dúvida, estamos aqui!

Abraços,
Equipe Surf Inn Rio',
  ARRAY['nome', 'check_in', 'check_out', 'numero_noites', 'numero_pessoas', 'tipo_quarto', 'pacote', 'preco_total']
),
(
  'Link de Pagamento',
  'Link de pagamento - {{nome}}',
  'Oi {{nome}}!

Tudo pronto para finalizar sua reserva! 💳

📅 {{check_in}} até {{check_out}}
👥 {{numero_pessoas}} pessoa(s)
🏠 {{tipo_quarto}}
💰 {{preco_total}}

Clique no link abaixo para efetuar o pagamento:
[LINK DE PAGAMENTO]

Qualquer dúvida, estamos aqui!

Abraços,
Equipe Surf Inn Rio',
  ARRAY['nome', 'check_in', 'check_out', 'numero_pessoas', 'tipo_quarto', 'preco_total']
) ON CONFLICT DO NOTHING;
