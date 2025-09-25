import { LeadWithCalculation } from '@/types/leads';
import { MessageTemplate, MessagePreview } from '@/types/messages';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  try {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return 'N/A';
  }
};

export const calculateNights = (checkIn: string | null, checkOut: string | null) => {
  if (!checkIn || !checkOut) return 0;
  try {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch {
    return 0;
  }
};

export const extractVariablesFromLead = (lead: LeadWithCalculation): Record<string, string> => {
  const nights = calculateNights(lead.check_in_start, lead.check_in_end);

  return {
    // Dados básicos
    nome: lead.name || lead.nome || 'N/A',
    email: lead.email || 'N/A',
    telefone: lead.telefone || lead.phone || 'N/A',

    // Reserva
    check_in: formatDate(lead.check_in_start),
    check_out: formatDate(lead.check_in_end),
    numero_pessoas: String(lead.number_of_people || lead.numero_de_pessoas || 0),
    numero_noites: String(nights),
    tipo_quarto: lead.tipo_de_quarto || 'N/A',
    pacote: lead.pacote || 'Sem pacote',

    // Preços
    preco_total: formatCurrency(lead.totalPrice || 0),
    preco_hospedagem: formatCurrency(lead.accommodationCost || 0),
    preco_extras: formatCurrency((lead.totalPrice || 0) - (lead.accommodationCost || 0)),
    preco_pacote: formatCurrency(lead.packageCost || 0),

    // Outros
    nivel_surf: lead.nivel_de_surf || 'N/A',
    observacoes: lead.obs_do_cliente || 'Nenhuma observação',
    data_hoje: format(new Date(), 'dd/MM/yyyy', { locale: ptBR }),
    status: lead.status || 'N/A',
  };
};

export const processTemplate = (template: MessageTemplate, lead: LeadWithCalculation): MessagePreview => {
  const variables = extractVariablesFromLead(lead);

  // Substituir variáveis no assunto e conteúdo
  let processedSubject = template.subject;
  let processedContent = template.content;

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processedSubject = processedSubject.replace(regex, value);
    processedContent = processedContent.replace(regex, value);
  });

  return {
    subject: processedSubject,
    content: processedContent,
    variables,
  };
};

export const extractVariablesFromText = (text: string): string[] => {
  const regex = /{{(\w+)}}/g;
  const variables: string[] = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
};