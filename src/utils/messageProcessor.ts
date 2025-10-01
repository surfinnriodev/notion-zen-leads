import { LeadWithCalculation } from '@/types/leads';
import { MessageTemplate, MessagePreview } from '@/types/messages';
import { PackageConfig } from '@/types/pricing';
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

/**
 * Formata os benefícios de um pacote para exibição
 */
export const formatPackageBenefits = (pkg: PackageConfig, nights: number): string => {
  const benefits: string[] = [];
  
  benefits.push(`${nights} nights & ${nights + 1} days`);
  
  if (pkg.includedItems.surfLessons) {
    benefits.push(`${pkg.includedItems.surfLessons} Surfing lesson${pkg.includedItems.surfLessons > 1 ? 's' : ''}`);
  }
  
  if (pkg.includedItems.yogaLessons) {
    benefits.push(`${pkg.includedItems.yogaLessons} Yoga Lesson${pkg.includedItems.yogaLessons > 1 ? 's' : ''}`);
  }
  
  if (pkg.includedItems.surfSkate) {
    benefits.push(`${pkg.includedItems.surfSkate} Surf Skate lesson${pkg.includedItems.surfSkate > 1 ? 's' : ''}`);
  }
  
  if (pkg.includedItems.videoAnalysis) {
    benefits.push(`Video Analysis`);
  }
  
  if (pkg.includedItems.massage) {
    benefits.push(`Ayurvedic Massage`);
  }
  
  if (pkg.includedItems.surfGuide) {
    benefits.push(`${pkg.includedItems.surfGuide} Surf Guidance`);
  }
  
  if (pkg.includedItems.unlimitedBoardRental) {
    benefits.push(`Optional Board Rental`);
  }
  
  if (pkg.includedItems.breakfast) {
    benefits.push(`Breakfast Optional`);
  }
  
  if (pkg.includedItems.transfer) {
    benefits.push(`Airport Transfer Optional`);
  }
  
  return benefits.join('\n');
};

/**
 * Formata um resumo completo de todos os serviços contratados pelo lead
 * Inclui hospedagem, atividades, itens diários e extras
 */
export const formatCompleteSummary = (lead: LeadWithCalculation, packages?: PackageConfig[], language: 'pt' | 'en' = 'pt'): string => {
  const sections: string[] = [];
  const nights = calculateNights(lead.check_in_start, lead.check_in_end);
  
  const labels = language === 'en' ? {
    accommodation: '📍 ACCOMMODATION:',
    night: 'night',
    nights: 'nights',
    activities: '🏄 ACTIVITIES:',
    surfLesson: 'Surf Lesson',
    surfLessons: 'Surf Lessons',
    yogaLesson: 'Yoga Lesson',
    yogaLessons: 'Yoga Lessons',
    surfSkateSession: 'Surf Skate Session',
    surfSkateSessions: 'Surf Skate Sessions',
    surfGuideDay: 'Surf Guide Day',
    surfGuideDays: 'Surf Guide Days',
    videoAnalysis: 'Video Analysis',
    videoAnalyses: 'Video Analyses',
    ayurvedicMassage: 'Ayurvedic Massage',
    ayurvedicMassages: 'Ayurvedic Massages',
    dailyItems: '☕ DAILY ITEMS:',
    breakfast: 'Breakfast',
    day: 'day',
    days: 'days',
    unlimitedBoardRental: 'Unlimited Board Rental',
    transfer: '✈️ TRANSFER:',
    airportTransfer: 'Airport Transfer',
    airportTransfers: 'Airport Transfers',
    experiences: '🌟 EXPERIENCES:',
    hike: 'Hike',
    rioCityTour: 'Rio City Tour',
    cariocaExperience: 'Carioca Experience',
    basePackage: '📦 BASE PACKAGE:',
    noServices: 'No services contracted'
  } : {
    accommodation: '📍 HOSPEDAGEM:',
    night: 'noite',
    nights: 'noites',
    activities: '🏄 ATIVIDADES:',
    surfLesson: 'Aula de Surf',
    surfLessons: 'Aulas de Surf',
    yogaLesson: 'Aula de Yoga',
    yogaLessons: 'Aulas de Yoga',
    surfSkateSession: 'Sessão de Surf Skate',
    surfSkateSessions: 'Sessões de Surf Skate',
    surfGuideDay: 'Dia de Surf Guide',
    surfGuideDays: 'Dias de Surf Guide',
    videoAnalysis: 'Análise de Vídeo',
    videoAnalyses: 'Análises de Vídeo',
    ayurvedicMassage: 'Massagem Ayurvédica',
    ayurvedicMassages: 'Massagens Ayurvédicas',
    dailyItems: '☕ ITENS DIÁRIOS:',
    breakfast: 'Café da Manhã',
    day: 'dia',
    days: 'dias',
    unlimitedBoardRental: 'Aluguel de Prancha Ilimitado',
    transfer: '✈️ TRANSFER:',
    airportTransfer: 'Transfer (Aeroporto)',
    airportTransfers: 'Transfers (Aeroporto)',
    experiences: '🌟 EXPERIÊNCIAS:',
    hike: 'Trilha',
    rioCityTour: 'Rio City Tour',
    cariocaExperience: 'Carioca Experience',
    basePackage: '📦 PACOTE BASE:',
    noServices: 'Nenhum serviço contratado'
  };
  
  // Hospedagem
  if (lead.tipo_de_quarto && lead.tipo_de_quarto !== 'Without room') {
    sections.push(labels.accommodation);
    sections.push(`${lead.tipo_de_quarto} - ${nights} ${nights !== 1 ? labels.nights : labels.night}`);
    sections.push('');
  }
  
  // Atividades
  const activities: string[] = [];
  
  if (lead.aulas_de_surf && lead.aulas_de_surf > 0) {
    activities.push(`• ${lead.aulas_de_surf} ${lead.aulas_de_surf > 1 ? labels.surfLessons : labels.surfLesson}`);
  }
  
  if (lead.aulas_de_yoga && lead.aulas_de_yoga > 0) {
    activities.push(`• ${lead.aulas_de_yoga} ${lead.aulas_de_yoga > 1 ? labels.yogaLessons : labels.yogaLesson}`);
  }
  
  if (lead.skate && lead.skate > 0) {
    activities.push(`• ${lead.skate} ${lead.skate > 1 ? labels.surfSkateSessions : labels.surfSkateSession}`);
  }
  
  if (lead.surf_guide || lead.surf_guide_package) {
    const total = (lead.surf_guide || 0) + (lead.surf_guide_package || 0);
    activities.push(`• ${total} ${total > 1 ? labels.surfGuideDays : labels.surfGuideDay}`);
  }
  
  if (lead.analise_de_video || lead.analise_de_video_package) {
    const total = (lead.analise_de_video || 0) + (lead.analise_de_video_package || 0);
    activities.push(`• ${total} ${total > 1 ? labels.videoAnalyses : labels.videoAnalysis}`);
  }
  
  if (lead.massagem_extra || lead.massagem_package) {
    const totalMassage = (lead.massagem_extra ? 1 : 0) + (lead.massagem_package || 0);
    activities.push(`• ${totalMassage} ${totalMassage > 1 ? labels.ayurvedicMassages : labels.ayurvedicMassage}`);
  }
  
  if (activities.length > 0) {
    sections.push(labels.activities);
    sections.push(...activities);
    sections.push('');
  }
  
  // Itens Diários
  const dailyItems: string[] = [];
  
  if (lead.breakfast) {
    dailyItems.push(`• ${labels.breakfast} (${nights} ${nights !== 1 ? labels.days : labels.day})`);
  }
  
  if (lead.aluguel_de_prancha) {
    dailyItems.push(`• ${labels.unlimitedBoardRental}`);
  }
  
  if (dailyItems.length > 0) {
    sections.push(labels.dailyItems);
    sections.push(...dailyItems);
    sections.push('');
  }
  
  // Transfers
  const totalTransfers = (lead.transfer_extra || 0) + (lead.transfer_package || 0) + (lead.transfer ? 1 : 0);
  if (totalTransfers > 0) {
    sections.push(labels.transfer);
    sections.push(`• ${totalTransfers} ${totalTransfers > 1 ? labels.airportTransfers : labels.airportTransfer}`);
    sections.push('');
  }
  
  // Experiências
  const experiences: string[] = [];
  
  if (lead.hike_extra) {
    experiences.push(`• ${labels.hike}`);
  }
  
  if (lead.rio_city_tour) {
    experiences.push(`• ${labels.rioCityTour}`);
  }
  
  if (lead.carioca_experience) {
    experiences.push(`• ${labels.cariocaExperience}`);
  }
  
  if (experiences.length > 0) {
    sections.push(labels.experiences);
    sections.push(...experiences);
    sections.push('');
  }
  
  // Pacote (se houver)
  if (lead.pacote && packages) {
    const selectedPackage = packages.find(pkg => pkg.id === lead.pacote || pkg.name === lead.pacote);
    if (selectedPackage) {
      sections.push(`${labels.basePackage} ${selectedPackage.name}`);
    }
  }
  
  return sections.join('\n').trim() || labels.noServices;
};

export const extractVariablesFromLead = (lead: LeadWithCalculation, packages?: PackageConfig[]): Record<string, string> => {
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

  // Formatar pacote com benefícios se disponível
  let packageDisplay = lead.pacote || 'Sem pacote';
  if (lead.pacote && packages) {
    const selectedPackage = packages.find(pkg => pkg.id === lead.pacote || pkg.name === lead.pacote);
    if (selectedPackage) {
      const benefits = formatPackageBenefits(selectedPackage, nights);
      packageDisplay = `${selectedPackage.name}\n\n${benefits}`;
    }
  }

  // Gerar resumo completo de serviços contratados (PT e EN)
  const completeSummaryPT = formatCompleteSummary(lead, packages, 'pt');
  const completeSummaryEN = formatCompleteSummary(lead, packages, 'en');

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
    pacote: packageDisplay,
    servicos_contratados: completeSummaryPT,
    servicos_contratados_en: completeSummaryEN,

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

export const processTemplate = (template: MessageTemplate, lead: LeadWithCalculation, packages?: PackageConfig[]): MessagePreview => {
  const variables = extractVariablesFromLead(lead, packages);

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