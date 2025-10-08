import { differenceInDays, getDay, format } from 'date-fns';

/**
 * Calcula o preço das aulas de surf baseado na quantidade (faixas de preço)
 * @param quantity Número de aulas por pessoa
 * @param surfLessonPricing Configuração das faixas de preço (opcional)
 * @returns Preço por aula baseado na faixa
 */
export function getSurfLessonPrice(quantity: number, surfLessonPricing?: { tier1: number; tier2: number; tier3: number }): number {
  const pricing = surfLessonPricing || { tier1: 180, tier2: 160, tier3: 140 };
  
  if (quantity >= 1 && quantity <= 3) {
    return pricing.tier1; // R$ 180 para 1-3 aulas (padrão)
  } else if (quantity >= 4 && quantity <= 7) {
    return pricing.tier2; // R$ 160 para 4-7 aulas (padrão)
  } else if (quantity >= 8) {
    return pricing.tier3; // R$ 140 para 8+ aulas (padrão)
  }
  return pricing.tier1; // Default para 1-3 aulas
}

/**
 * Calcula quantos dias de yoga grátis existem entre as datas de check-in e check-out
 * Yoga é grátis nas quartas e sextas-feiras às 7h da manhã
 * IMPORTANTE: Se o check-in é no mesmo dia da aula de yoga, não conta como grátis
 * pois o check-in é às 11h e a aula às 7h (não dá tempo de participar)
 * @param checkInStart Data de check-in
 * @param checkInEnd Data de check-out
 * @returns Número de dias de yoga grátis
 */
export function calculateFreeYogaDays(checkInStart: string, checkInEnd: string): number {
  const start = new Date(checkInStart);
  const end = new Date(checkInEnd);
  
  let freeDays = 0;
  const current = new Date(start);
  
  // Pular o primeiro dia (dia do check-in) pois o check-in é às 11h e yoga às 7h
  current.setDate(current.getDate() + 1);
  
  // Iterar através de cada dia entre check-in+1 e check-out
  while (current < end) {
    const dayOfWeek = getDay(current); // 0 = domingo, 1 = segunda, ..., 3 = quarta, 5 = sexta, 6 = sábado
    
    // Quarta-feira = 3, Sexta-feira = 5
    if (dayOfWeek === 3 || dayOfWeek === 5) {
      freeDays++;
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return freeDays;
}

/**
 * Calcula o número de transfers necessários baseado no número de pessoas
 * Regra: ACIMA DE 3 PESSOAS, 2 TRANSFERS
 * @param numberOfPeople Número de pessoas
 * @returns Número de transfers necessários
 */
export function calculateTransfersForGroup(numberOfPeople: number): number {
  if (numberOfPeople > 3) {
    return 2; // 2 transfers para grupos acima de 3 pessoas
  }
  return 1; // 1 transfer para grupos de 3 pessoas ou menos
}

/**
 * Calcula o valor retido e valor pendente conforme as regras documentadas
 * @param servicesCost Custo total dos serviços
 * @param feeCost Custo da taxa
 * @param accommodationCost Custo da hospedagem
 * @param breakfastCost Custo do café da manhã
 * @returns Objeto com valor retido e valor pendente
 */
export function calculateRetainedAndPendingValues(
  servicesCost: number,
  feeCost: number,
  accommodationCost: number,
  breakfastCost: number
): { retainedValue: number; pendingValue: number } {
  const retainedValue = servicesCost + feeCost;
  const pendingValue = accommodationCost + breakfastCost;
  
  return {
    retainedValue,
    pendingValue
  };
}

/**
 * Formata valores monetários em reais
 * @param value Valor numérico
 * @returns String formatada como moeda brasileira
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Calcula o total de serviços (sem hospedagem e café)
 * @param breakdown Breakdown dos custos
 * @returns Total dos serviços
 */
export function calculateServicesTotal(breakdown: any): number {
  let servicesTotal = 0;
  
  // Somar itens fixos (aulas, extras)
  if (breakdown.fixedItems) {
    breakdown.fixedItems.forEach((item: any) => {
      servicesTotal += item.cost;
    });
  }
  
  return servicesTotal;
}

/**
 * Gera mensagem detalhada de cálculo conforme o exemplo do documento
 * @param lead Dados do lead
 * @param calculation Resultado do cálculo
 * @returns Mensagem formatada
 */
export function generateCalculationMessage(lead: any, calculation: any): string {
  const checkIn = format(new Date(lead.check_in_start), 'dd/MM/yyyy');
  const checkOut = format(new Date(lead.check_in_end), 'dd/MM/yyyy');
  const nights = calculation.numberOfNights;
  const people = calculation.numberOfPeople;
  
  let message = `Informações do Lead\n`;
  message += `Nome: ${lead.nome}\n`;
  message += `Email: ${lead.email}\n`;
  message += `Telefone: ${lead.telefone}\n`;
  message += `\nPreferências\n`;
  message += `Pessoas: ${people}\n`;
  message += `Período: ${checkIn} → ${checkOut} (${nights} noites)\n`;
  message += `Quarto: ${lead.tipo_de_quarto}\n`;
  message += `Nível de Surf: ${lead.nivel_de_surf || 'não informado'}\n`;
  message += `Aulas de Surf: ${lead.aulas_de_surf || 0} por pessoa\n`;
  message += `Aulas de Yoga: ${lead.aulas_de_yoga || 0} por pessoa\n`;
  message += `Café da manhã: ${lead.breakfast ? 'Incluso' : 'Não incluso'}\n`;
  message += `Aluguel de prancha ilimitado: ${lead.aluguel_de_prancha ? 'Sim' : 'Não'}\n`;
  
  message += `\nCálculos (serviços)\n`;
  
  // Calcular aulas de surf
  const surfLessons = lead.aulas_de_surf || 0;
  if (surfLessons > 0) {
    // IMPORTANTE: Usar o TOTAL de aulas para determinar a faixa de preço
    const totalSurfLessons = surfLessons * people;
    const surfPrice = getSurfLessonPrice(totalSurfLessons, calculation.surfLessonPricing);
    const surfTotal = totalSurfLessons * surfPrice;
    message += `Aulas de Surf: ${totalSurfLessons} total (${surfLessons} × ${people} pessoas) × R$ ${surfPrice} = ${formatCurrency(surfTotal)}\n`;
  }
  
  // Calcular yoga (considerando dias grátis)
  const yogaLessons = lead.aulas_de_yoga || 0;
  if (yogaLessons > 0) {
    const freeYogaDays = calculateFreeYogaDays(lead.check_in_start, lead.check_in_end);
    const chargedYogaLessons = Math.max(0, yogaLessons - freeYogaDays);
    const yogaTotal = chargedYogaLessons * 120 * people;
    message += `Yoga: ${chargedYogaLessons} × R$ 120 × ${people} pessoas = ${formatCurrency(yogaTotal)}\n`;
  }
  
  const servicesTotal = calculateServicesTotal(calculation.breakdown);
  message += `Subtotal serviços (sem hospedagem): ${formatCurrency(servicesTotal)}\n`;
  
  message += `\nHospedagem e Totais\n`;
  message += `Hospedagem (BRL): ${formatCurrency(calculation.accommodationCost)}\n`;
  message += `Taxa (BRL): R$ 0,00 (Sempre será acrescentada manualmente)\n`;
  
  const totalCost = calculation.totalCost;
  message += `Total geral = ${formatCurrency(totalCost)}\n`;
  
  const { retainedValue, pendingValue } = calculateRetainedAndPendingValues(
    servicesTotal,
    0, // Taxa sempre manual
    calculation.accommodationCost,
    calculation.dailyItemsCost
  );
  
  message += `Valor retido = ${formatCurrency(retainedValue)} (Serviços + Taxa)\n`;
  message += `Valor pendente: ${formatCurrency(pendingValue)} (Hospedagem + Café)\n`;
  
  return message;
}
