export interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[]; // Lista de variáveis usadas no template
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface MessagePreview {
  subject: string;
  content: string;
  variables: Record<string, string>;
}

// Variáveis disponíveis para templates
export const AVAILABLE_VARIABLES = [
  // Dados básicos
  { 
    key: 'nome', 
    label: 'Nome', 
    example: 'João Silva',
    description: 'Nome completo do cliente'
  },
  { 
    key: 'email', 
    label: 'Email', 
    example: 'joao@email.com',
    description: 'Endereço de email do cliente'
  },
  { 
    key: 'telefone', 
    label: 'Telefone', 
    example: '(21) 99999-9999',
    description: 'Número de telefone do cliente'
  },

  // Reserva
  { 
    key: 'check_in', 
    label: 'Check-in', 
    example: '15/12/2024',
    description: 'Data de chegada formatada (dd/mm/aaaa)'
  },
  { 
    key: 'check_out', 
    label: 'Check-out', 
    example: '20/12/2024',
    description: 'Data de saída formatada (dd/mm/aaaa)'
  },
  { 
    key: 'numero_pessoas', 
    label: 'Número de pessoas', 
    example: '2',
    description: 'Quantidade de pessoas na reserva'
  },
  { 
    key: 'numero_noites', 
    label: 'Número de noites', 
    example: '5',
    description: 'Quantidade de noites de hospedagem'
  },
  { 
    key: 'tipo_quarto', 
    label: 'Tipo de quarto', 
    example: 'Private: Double',
    description: 'Categoria do quarto selecionado'
  },
  { 
    key: 'pacote', 
    label: 'Pacote (benefícios base)', 
    example: 'Package 2 - Carioca Ride\n\n5 nights & 6 days...',
    description: 'Descrição completa do pacote com benefícios incluídos'
  },

  // Resumos de Serviços
  { 
    key: 'servicos_contratados', 
    label: '📋 Resumo Completo (PT)', 
    example: '📍 HOSPEDAGEM:\nPrivate: Double - 5 noites\n\n🏄 ATIVIDADES:\n• 6 Aulas de Surf...',
    description: 'Resumo completo em português com hospedagem, atividades e preços'
  },
  { 
    key: 'servicos_contratados_en', 
    label: '📋 Complete Summary (EN)', 
    example: '📍 ACCOMMODATION:\nPrivate: Double - 5 nights\n\n🏄 ACTIVITIES:\n• 6 Surf Lessons...',
    description: 'Resumo completo em inglês com hospedagem, atividades e preços'
  },
  { 
    key: 'internal_resume_pt', 
    label: '💰 Resumo Interno Detalhado (PT)', 
    example: 'RESUMO DETALHADO DOS SERVIÇOS\n\nHospedagem: R$ 3.000,00\nCafé da Manhã: R$ 90,00\n\nServiços:\n- 10 Aulas de Surf × 2 pessoas = R$ 3.200,00...',
    description: 'Resumo interno detalhado em português com cálculos e valores específicos'
  },
  { 
    key: 'internal_resume_en', 
    label: '💰 Detailed Internal Summary (EN)', 
    example: 'DETAILED SERVICE SUMMARY\n\nAccommodation: R$ 3,000.00\nBreakfast: R$ 90.00\n\nServices:\n- 10 Surf Lessons × 2 people = R$ 3,200.00...',
    description: 'Resumo interno detalhado em inglês com cálculos e valores específicos'
  },

  // Preços
  { 
    key: 'preco_total', 
    label: 'Preço Total', 
    example: 'R$ 2.500,00',
    description: 'Valor total da reserva formatado em reais'
  },
  { 
    key: 'preco_hospedagem', 
    label: 'Preço Hospedagem', 
    example: 'R$ 1.200,00',
    description: 'Valor apenas da hospedagem formatado em reais'
  },
  { 
    key: 'preco_extras', 
    label: 'Preço Extras', 
    example: 'R$ 800,00',
    description: 'Valor dos serviços extras (aulas, atividades) formatado em reais'
  },
  { 
    key: 'preco_pacote', 
    label: 'Preço Pacote', 
    example: 'R$ 500,00',
    description: 'Valor do pacote base formatado em reais'
  },

  // Outros
  { 
    key: 'nivel_surf', 
    label: 'Nível de surf', 
    example: 'Iniciante',
    description: 'Nível de surf informado pelo cliente'
  },
  { 
    key: 'observacoes', 
    label: 'Observações', 
    example: 'Interesse em aulas de yoga',
    description: 'Observações e comentários do cliente'
  },
  { 
    key: 'data_hoje', 
    label: 'Data de hoje', 
    example: '25/09/2024',
    description: 'Data atual formatada (dd/mm/aaaa)'
  },
  { 
    key: 'status', 
    label: 'Status', 
    example: 'Lead',
    description: 'Status atual do lead no sistema'
  },
] as const;

export type VariableKey = typeof AVAILABLE_VARIABLES[number]['key'];