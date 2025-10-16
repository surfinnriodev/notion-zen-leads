import { LeadWithCalculation } from '@/types/leads';
import { MessageTemplate, MessagePreview } from '@/types/messages';
import { PackageConfig } from '@/types/pricing';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getSurfLessonPrice } from './pricingRules';

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  try {
    // Garantir que a data seja interpretada como local (Brasil) e não UTC
    // Se a string está no formato YYYY-MM-DD, extrair os componentes
    const dateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      const [, year, month, day] = dateMatch;
      // Criar data explicitamente com os valores locais
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    }
    // Fallback para o método original
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
  const people = lead.number_of_people || 1;
  
  const labels = language === 'en' ? {
    accommodation: 'ACCOMMODATION:',
    night: 'night',
    nights: 'nights',
    people: 'people',
    person: 'person',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    activities: 'ACTIVITIES:',
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
    dailyItems: 'DAILY ITEMS:',
    breakfast: 'Breakfast',
    day: 'day',
    days: 'days',
    unlimitedBoardRental: 'Unlimited Board Rental',
    transfer: 'TRANSFER:',
    airportTransfer: 'Airport Transfer',
    airportTransfers: 'Airport Transfers',
    experiences: 'EXPERIENCES:',
    hike: 'Hike',
    rioCityTour: 'Rio City Tour',
    cariocaExperience: 'Carioca Experience',
    basePackage: 'BASE PACKAGE:',
    customPackage: 'Custom Package',
    totalPrice: 'TOTAL PRICE:',
    noServices: 'No services contracted'
  } : {
    accommodation: 'HOSPEDAGEM:',
    night: 'noite',
    nights: 'noites',
    people: 'pessoas',
    person: 'pessoa',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    activities: 'ATIVIDADES:',
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
    dailyItems: 'ITENS DIÁRIOS:',
    breakfast: 'Café da Manhã',
    day: 'dia',
    days: 'dias',
    unlimitedBoardRental: 'Aluguel de Prancha Ilimitado',
    transfer: 'TRANSFER:',
    airportTransfer: 'Transfer (Aeroporto)',
    airportTransfers: 'Transfers (Aeroporto)',
    experiences: 'EXPERIÊNCIAS:',
    hike: 'Trilha',
    rioCityTour: 'Rio City Tour',
    cariocaExperience: 'Carioca Experience',
    basePackage: 'BASE PACKAGE:',
    customPackage: 'Pacote Personalizado',
    totalPrice: 'PREÇO TOTAL:',
    noServices: 'Nenhum serviço contratado'
  };
  
  // Hospedagem - usar room_category + room_type se disponível para mais detalhes
  if (lead.tipo_de_quarto && lead.tipo_de_quarto !== 'Without room') {
    sections.push(labels.accommodation);
    
    // Construir descrição completa do quarto
    let roomDescription = lead.tipo_de_quarto;
    
    // Se temos room_category e room_type separados, usar eles para mais detalhes
    if (lead.room_category && lead.room_type && lead.room_category !== 'Select' && lead.room_type !== 'Select') {
      roomDescription = `${lead.room_category}: ${lead.room_type}`;
    }
    
    sections.push(`${roomDescription}`);
    sections.push(`${labels.checkIn}: ${formatDate(lead.check_in_start)} | ${labels.checkOut}: ${formatDate(lead.check_in_end)}`);
    sections.push(`${nights} ${nights !== 1 ? labels.nights : labels.night} • ${people} ${people > 1 ? labels.people : labels.person}`);
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
    const totalMassage = (lead.massagem_extra || 0) + (lead.massagem_package || 0);
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
  
  // Remover seção de pacote conforme solicitado pelo cliente
  
  sections.push('');
  
  // Preço Total
  if (lead.calculatedPrice) {
    let totalPrice = lead.calculatedPrice.totalCost || 0;
    
    // Adicionar ajustes
    if (lead.accommodation_price_override) {
      const originalAccommodationCost = lead.calculatedPrice.accommodationCost || 0;
      const adjustment = lead.accommodation_price_override - originalAccommodationCost;
      totalPrice += adjustment;
    }
    
    if (lead.extra_fee_amount) {
      totalPrice += lead.extra_fee_amount;
    }
    
    sections.push(`${labels.totalPrice} ${formatCurrency(totalPrice)}`);
  }
  
  return sections.join('\n').trim() || labels.noServices;
};

/**
 * Formata um resumo interno detalhado com valores de todos os serviços
 * Inclui breakdown de preços, cálculos e totais
 */
export const formatInternalResume = (lead: LeadWithCalculation, config: any, language: 'pt' | 'en' = 'pt'): string => {
  const sections: string[] = [];
  const nights = calculateNights(lead.check_in_start, lead.check_in_end);
  const people = lead.number_of_people || 1;
  
  const labels = language === 'en' ? {
    title: 'DETAILED SERVICE SUMMARY',
    accommodation: 'Accommodation',
    breakfast: 'Breakfast',
    days: 'days',
    services: 'Services',
    surfLesson: 'Surf Lesson',
    surfLessons: 'Surf Lessons',
    yogaLesson: 'Yoga Lesson',
    yogaLessons: 'Yoga Lessons',
    freeYoga: 'free',
    paidYoga: 'paid',
    surfSkate: 'Surf Skate',
    session: 'session',
    sessions: 'sessions',
    surfGuide: 'Surf Guide',
    day: 'day',
    videoAnalysis: 'Video Analysis',
    massage: 'Massage',
    unlimitedBoard: 'Unlimited Board Rental',
    transfer: 'Transfer',
    leg: 'leg',
    legs: 'legs',
    upTo3pax: 'up to 3 pax',
    hike: 'Hike',
    rioCityTour: 'Rio City Tour',
    cariocaExp: 'Carioca Experience',
    fee: 'Fee',
    total: 'Total',
    deposit: 'Deposit Amount',
    pending: 'Pending Amount',
    depositCalc: '(Services + Fee)',
    pendingCalc: '(Accommodation + Breakfast)',
    people: 'people',
    person: 'person'
  } : {
    title: 'RESUMO DETALHADO DOS SERVIÇOS',
    accommodation: 'Hospedagem',
    breakfast: 'Café da Manhã',
    days: 'dias',
    services: 'Serviços',
    surfLesson: 'Aula de Surf',
    surfLessons: 'Aulas de Surf',
    yogaLesson: 'Aula de Yoga',
    yogaLessons: 'Aulas de Yoga',
    freeYoga: 'grátis',
    paidYoga: 'paga',
    surfSkate: 'Surf Skate',
    session: 'sessão',
    sessions: 'sessões',
    surfGuide: 'Surf Guide',
    day: 'dia',
    videoAnalysis: 'Análise de Vídeo',
    massage: 'Massagem',
    unlimitedBoard: 'Aluguel Prancha Ilimitado',
    transfer: 'Transfer',
    leg: 'trecho',
    legs: 'trechos',
    upTo3pax: 'até 3 pax',
    hike: 'Trilha',
    rioCityTour: 'Rio City Tour',
    cariocaExp: 'Carioca Experience',
    fee: 'Taxa',
    total: 'Total',
    deposit: 'Valor Depósito',
    pending: 'Valor Pendente',
    depositCalc: '(Serviços + Taxa)',
    pendingCalc: '(Hospedagem + Café)',
    people: 'pessoas',
    person: 'pessoa'
  };
  
  sections.push(`${labels.title}\n`);
  
  // Calcular valores
  const calculatedPrice = lead.calculatedPrice;
  if (!calculatedPrice) {
    return language === 'en' ? 'No calculation available' : 'Cálculo não disponível';
  }
  
  // Hospedagem
  const accommodationCost = lead.accommodation_price_override || calculatedPrice.accommodationCost || 0;
  if (accommodationCost > 0) {
    sections.push(`${labels.accommodation}: ${formatCurrency(accommodationCost)}`);
  }
  
  // Café da Manhã
  const breakfastCost = (calculatedPrice as any).breakfastOnlyCost || 0;
  if (breakfastCost > 0) {
    sections.push(`${labels.breakfast}: ${formatCurrency(breakfastCost)} (${nights} ${labels.days} × ${people} ${people > 1 ? labels.people : labels.person})`);
  }
  
  sections.push('');
  sections.push(`${labels.services}:`);
  
  // Itens do pacote ou serviços individuais
  const packageCost = calculatedPrice.packageCost || 0;
  if (packageCost > 0 && lead.pacote) {
    sections.push(`- Pacote "${lead.pacote}": ${formatCurrency(packageCost)}`);
  }
  
  // Aulas de Surf (com faixas de preço)
  if (lead.aulas_de_surf && lead.aulas_de_surf > 0) {
    // Calcular TOTAL de aulas para determinar a faixa de preço
    const totalSurfLessons = lead.aulas_de_surf * people;
    // Usar preço baseado na faixa do TOTAL de aulas (não apenas por pessoa)
    const pricePerLesson = getSurfLessonPrice(totalSurfLessons, config.surfLessonPricing);
    const surfCost = pricePerLesson * totalSurfLessons;
    const tierLabel = totalSurfLessons <= 3 ? '1-3' : totalSurfLessons <= 7 ? '4-7' : '8+';
    sections.push(`- ${lead.aulas_de_surf} ${lead.aulas_de_surf > 1 ? labels.surfLessons : labels.surfLesson} × ${people} ${people > 1 ? labels.people : labels.person} (${formatCurrency(pricePerLesson)}/aula - faixa ${tierLabel}) = ${formatCurrency(surfCost)}`);
  }
  
  // Yoga (com dias grátis)
  if (lead.aulas_de_yoga && lead.aulas_de_yoga > 0) {
    const freeYogaDays = lead.check_in_start && lead.check_in_end ? 
      (() => {
        const start = new Date(lead.check_in_start);
        const end = new Date(lead.check_in_end);
        let freeDays = 0;
        const current = new Date(start);
        // Pular o primeiro dia (dia do check-in) pois o check-in é às 11h e yoga às 7h
        current.setDate(current.getDate() + 1);
        while (current < end) {
          const dayOfWeek = current.getDay();
          if (dayOfWeek === 3 || dayOfWeek === 5) freeDays++;
          current.setDate(current.getDate() + 1);
        }
        return freeDays;
      })() : 0;
    
    const paidYoga = Math.max(0, lead.aulas_de_yoga - freeYogaDays);
    const yogaItem = config.items?.find((i: any) => i.id === 'yoga-lesson');
    const yogaPrice = yogaItem?.price || 120;
    const yogaCost = paidYoga * people * yogaPrice;
    
    if (freeYogaDays > 0) {
      sections.push(`- ${freeYogaDays} ${labels.yogaLesson} ${labels.freeYoga} + ${paidYoga} ${labels.paidYoga} = ${formatCurrency(yogaCost)}`);
    } else {
      sections.push(`- ${lead.aulas_de_yoga} ${lead.aulas_de_yoga > 1 ? labels.yogaLessons : labels.yogaLesson} × ${people} ${people > 1 ? labels.people : labels.person} = ${formatCurrency(yogaCost)}`);
    }
  }
  
  // Surf Skate
  if (lead.skate && lead.skate > 0) {
    const skateItem = config.items?.find((i: any) => i.id === 'skate');
    const skatePrice = skateItem?.price || 0;
    const skateCost = lead.skate * people * skatePrice;
    sections.push(`- ${lead.skate} ${lead.skate > 1 ? labels.sessions : labels.session} ${labels.surfSkate} × ${people} ${people > 1 ? labels.people : labels.person} = ${formatCurrency(skateCost)}`);
  }
  
  // Surf Guide
  const totalSurfGuide = (lead.surf_guide || 0) + (lead.surf_guide_package || 0);
  if (totalSurfGuide > 0) {
    const guideItem = config.items?.find((i: any) => i.id === 'surf_guide');
    const guidePrice = guideItem?.price || 0;
    const guideCost = totalSurfGuide * guidePrice;
    sections.push(`- ${totalSurfGuide} ${totalSurfGuide > 1 ? labels.days : labels.day} ${labels.surfGuide} = ${formatCurrency(guideCost)}`);
  }
  
  // Análise de Vídeo
  const totalVideo = (lead.analise_de_video || 0) + (lead.analise_de_video_package || 0);
  if (totalVideo > 0) {
    const videoItem = config.items?.find((i: any) => i.id === 'analise_de_video');
    const videoPrice = videoItem?.price || 0;
    const videoCost = totalVideo * videoPrice;
    sections.push(`- ${totalVideo} ${labels.videoAnalysis} = ${formatCurrency(videoCost)}`);
  }
  
  // Massagem - cobrar APENAS as extras (massagem_package já está incluída no pacote)
  const massagemExtra = lead.massagem_extra || 0;
  const massagemPackage = lead.massagem_package || 0;
  const totalMassage = massagemExtra + massagemPackage;
  
  if (totalMassage > 0) {
    const massageItem = config.items?.find((i: any) => i.id === 'massage');
    const massagePrice = massageItem?.price || 0;
    
    // Cobrar APENAS as extras
    const massageCost = massagemExtra * massagePrice;
    
    if (massagemExtra > 0) {
      let massageLabel = `${massagemExtra} ${labels.massage}`;
      if (massagemPackage > 0) {
        massageLabel += ` (${massagemPackage} incluída${massagemPackage > 1 ? 's' : ''} no pacote)`;
      }
      sections.push(`- ${massageLabel} = ${formatCurrency(massageCost)}`);
    } else if (massagemPackage > 0) {
      // Apenas as do pacote (grátis)
      sections.push(`- ${massagemPackage} ${labels.massage} (incluída${massagemPackage > 1 ? 's' : ''} no pacote) = ${formatCurrency(0)}`);
    }
  }
  
  // Aluguel de Prancha
  if (lead.aluguel_de_prancha) {
    const boardItem = config.items?.find((i: any) => i.id === 'unlimited-board-rental');
    const boardPrice = boardItem?.price || 0;
    const boardCost = boardPrice * nights * (boardItem?.billingType === 'per_person' ? people : 1);
    const displayText = boardItem?.billingType === 'per_person' 
      ? `- ${labels.unlimitedBoard} (${nights} ${labels.days} × ${people} ${people > 1 ? labels.people : labels.person}) = ${formatCurrency(boardCost)}`
      : `- ${labels.unlimitedBoard} (${nights} ${labels.days}) = ${formatCurrency(boardCost)}`;
    sections.push(displayText);
  }
  
  // Transfer - considerar os incluídos no pacote
  const totalTransfers = (lead.transfer_extra || 0) + (lead.transfer_package || 0) + (lead.transfer ? 1 : 0);
  if (totalTransfers > 0) {
    const transferItem = config.items?.find((i: any) => i.id === 'transfer');
    const transferPrice = transferItem?.price || 0;
    
    // Verificar se há pacote e quantos transfers estão incluídos
    const selectedPackage = lead.pacote && config.packages?.find((pkg: any) => 
      pkg.id === lead.pacote || pkg.name === lead.pacote
    );
    const includedTransfers = selectedPackage?.includedItems?.transfer || 0;
    const transfersToCobrar = Math.max(0, totalTransfers - includedTransfers);
    
    if (transfersToCobrar > 0) {
      const transferCost = transfersToCobrar * transferPrice;
      let transferLabel = `${transfersToCobrar} ${transfersToCobrar > 1 ? labels.legs : labels.leg}`;
      if (includedTransfers > 0) {
        transferLabel += ` (${includedTransfers} incluído${includedTransfers > 1 ? 's' : ''} no pacote)`;
      }
      sections.push(`- ${transferLabel} ${labels.transfer} = ${formatCurrency(transferCost)}`);
    } else if (includedTransfers > 0) {
      // Todos estão incluídos no pacote
      sections.push(`- ${totalTransfers} ${totalTransfers > 1 ? labels.legs : labels.leg} ${labels.transfer} (incluído${totalTransfers > 1 ? 's' : ''} no pacote) = ${formatCurrency(0)}`);
    }
  }
  
  // Experiências
  if (lead.hike_extra) {
    const hikeItem = config.items?.find((i: any) => i.id === 'hike');
    const hikePrice = hikeItem?.price || 0;
    const hikeCost = hikePrice * people;
    sections.push(`- ${labels.hike} × ${people} ${people > 1 ? labels.people : labels.person} = ${formatCurrency(hikeCost)}`);
  }
  
  if (lead.rio_city_tour) {
    const tourItem = config.items?.find((i: any) => i.id === 'rio-city-tour');
    const tourPrice = tourItem?.price || 0;
    const tourCost = tourPrice * people;
    sections.push(`- ${labels.rioCityTour} × ${people} ${people > 1 ? labels.people : labels.person} = ${formatCurrency(tourCost)}`);
  }
  
  if (lead.carioca_experience) {
    const expItem = config.items?.find((i: any) => i.id === 'carioca-experience');
    const expPrice = expItem?.price || 0;
    const expCost = expPrice * people;
    sections.push(`- ${labels.cariocaExp} × ${people} ${people > 1 ? labels.people : labels.person} = ${formatCurrency(expCost)}`);
  }
  
  sections.push('');
  
  // Taxa
  const feeCost = lead.extra_fee_amount || 0;
  sections.push(`${labels.fee}: ${formatCurrency(feeCost)}`);
  
  sections.push('');
  
  // Calcular totais
  const servicesCost = (calculatedPrice.packageCost || 0) + (calculatedPrice.fixedItemsCost || 0);
  const valorDeposito = servicesCost + feeCost;
  const valorPendente = accommodationCost + breakfastCost;
  const totalGeral = valorDeposito + valorPendente;
  
  sections.push(`${labels.total}: ${formatCurrency(totalGeral)}`);
  sections.push('');
  sections.push(`${labels.deposit} = ${formatCurrency(valorDeposito)} ${labels.depositCalc}`);
  sections.push(`${labels.pending}: ${formatCurrency(valorPendente)} ${labels.pendingCalc}`);
  
  return sections.join('\n');
};

export const extractVariablesFromLead = (lead: LeadWithCalculation, packagesOrConfig?: PackageConfig[] | any): Record<string, string> => {
  const nights = calculateNights(lead.check_in_start, lead.check_in_end);

  // Detectar se recebeu packages array ou config object
  const packages = Array.isArray(packagesOrConfig) ? packagesOrConfig : packagesOrConfig?.packages;
  const config = Array.isArray(packagesOrConfig) ? { packages: packagesOrConfig } : packagesOrConfig;

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
    const selectedPackage = packages.find((pkg: any) => pkg.id === lead.pacote || pkg.name === lead.pacote);
    if (selectedPackage) {
      const benefits = formatPackageBenefits(selectedPackage, nights);
      packageDisplay = `${selectedPackage.name}\n\n${benefits}`;
    }
  }

  // Gerar resumo completo de serviços contratados (PT e EN)
  const completeSummaryPT = formatCompleteSummary(lead, packages, 'pt');
  const completeSummaryEN = formatCompleteSummary(lead, packages, 'en');

  // Gerar resumo interno detalhado com valores (PT e EN)
  const internalResumePT = formatInternalResume(lead, config, 'pt');
  const internalResumeEN = formatInternalResume(lead, config, 'en');

  // Construir descrição completa do quarto
  let roomDescription = lead.tipo_de_quarto || 'N/A';
  if (lead.room_category && lead.room_type && lead.room_category !== 'Select' && lead.room_type !== 'Select') {
    roomDescription = `${lead.room_category}: ${lead.room_type}`;
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
    tipo_quarto: roomDescription,
    pacote: packageDisplay,
    servicos_contratados: completeSummaryPT,
    servicos_contratados_en: completeSummaryEN,
    internal_resume_pt: internalResumePT,
    internal_resume_en: internalResumeEN,

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

export const processTemplate = (template: MessageTemplate, lead: LeadWithCalculation, packagesOrConfig?: PackageConfig[] | any): MessagePreview => {
  const variables = extractVariablesFromLead(lead, packagesOrConfig);

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