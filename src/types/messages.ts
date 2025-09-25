export interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[]; // Lista de variáveis usadas no template
  createdAt: string;
  updatedAt: string;
}

export interface MessagePreview {
  subject: string;
  content: string;
  variables: Record<string, string>;
}

// Variáveis disponíveis para templates
export const AVAILABLE_VARIABLES = [
  // Dados básicos
  { key: 'nome', label: 'Nome', example: 'João Silva' },
  { key: 'email', label: 'Email', example: 'joao@email.com' },
  { key: 'telefone', label: 'Telefone', example: '(21) 99999-9999' },

  // Reserva
  { key: 'check_in', label: 'Check-in', example: '15/12/2024' },
  { key: 'check_out', label: 'Check-out', example: '20/12/2024' },
  { key: 'numero_pessoas', label: 'Número de pessoas', example: '2' },
  { key: 'numero_noites', label: 'Número de noites', example: '5' },
  { key: 'tipo_quarto', label: 'Tipo de quarto', example: 'Private: Double' },
  { key: 'pacote', label: 'Pacote', example: 'Pacote Completo' },

  // Preços
  { key: 'preco_total', label: 'Preço Total', example: 'R$ 2.500,00' },
  { key: 'preco_hospedagem', label: 'Preço Hospedagem', example: 'R$ 1.200,00' },
  { key: 'preco_extras', label: 'Preço Extras', example: 'R$ 800,00' },
  { key: 'preco_pacote', label: 'Preço Pacote', example: 'R$ 500,00' },

  // Outros
  { key: 'nivel_surf', label: 'Nível de surf', example: 'Iniciante' },
  { key: 'observacoes', label: 'Observações', example: 'Interesse em aulas de yoga' },
  { key: 'data_hoje', label: 'Data de hoje', example: '25/09/2024' },
  { key: 'status', label: 'Status', example: 'Lead' },
] as const;

export type VariableKey = typeof AVAILABLE_VARIABLES[number]['key'];