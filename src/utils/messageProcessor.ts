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

  // Calcular o preço total incluindo ajustes de hospedagem e taxa extra
  let totalPrice = lead.totalPrice || 0;
  let accommodationPrice = lead.accommodationCost || 0;
  
  // Se houver calculatedPrice, usar os valores de lá
  if (lead.calculatedPrice) {
    totalPrice = lead.calculatedPrice.totalCost || 0;
    accommodationPrice = lead.calculatedPrice.accommodationCost || 0;
    
    // Adicionar ajuste de hospedagem se houver
    if (lead.accommodation_price_override) {
      const adjustment = lead.accommodation_price_override - accommodationPrice;
      totalPrice += adjustment;
      accommodationPrice = lead.accommodation_price_override;
    }
    
    // Adicionar taxa extra se houver
    if (lead.extra_fee_amount) {
      totalPrice += lead.extra_fee_amount;
    }
  }

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

    // Preços (agora incluindo ajustes e taxa extra)
    preco_total: formatCurrency(totalPrice),
    preco_hospedagem: formatCurrency(accommodationPrice),
    preco_extras: formatCurrency(totalPrice - accommodationPrice),
    preco_pacote: formatCurrency(lead.packageCost || (lead.calculatedPrice?.packageCost || 0)),

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