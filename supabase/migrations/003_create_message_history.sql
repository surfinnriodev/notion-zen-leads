-- Tabela para histórico de mensagens enviadas
CREATE TABLE IF NOT EXISTS message_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id INTEGER NOT NULL,
  template_id UUID,
  subject VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(50) NOT NULL DEFAULT 'template', -- 'template' ou 'custom'
  sent_via VARCHAR(50) DEFAULT 'manual', -- 'manual', 'whatsapp', 'email', etc.
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Referência ao lead
  CONSTRAINT fk_message_history_lead 
    FOREIGN KEY (lead_id) 
    REFERENCES reservations(id) 
    ON DELETE CASCADE,
    
  -- Referência ao template (opcional)
  CONSTRAINT fk_message_history_template 
    FOREIGN KEY (template_id) 
    REFERENCES message_templates(id) 
    ON DELETE SET NULL
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_message_history_lead_id ON message_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_message_history_template_id ON message_history(template_id);
CREATE INDEX IF NOT EXISTS idx_message_history_sent_at ON message_history(sent_at);
CREATE INDEX IF NOT EXISTS idx_message_history_message_type ON message_history(message_type);

-- Comentários para documentação
COMMENT ON TABLE message_history IS 'Histórico de mensagens enviadas para leads';
COMMENT ON COLUMN message_history.lead_id IS 'ID do lead que recebeu a mensagem';
COMMENT ON COLUMN message_history.template_id IS 'ID do template usado (NULL se mensagem customizada)';
COMMENT ON COLUMN message_history.message_type IS 'Tipo da mensagem: template ou custom';
COMMENT ON COLUMN message_history.sent_via IS 'Canal usado para envio: manual, whatsapp, email, etc.';
