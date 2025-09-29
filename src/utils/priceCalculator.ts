import { differenceInDays } from 'date-fns';
import { PricingConfig, CalculationInput, CalculationResult } from '@/types/pricing';
import { PricingConfigData } from '@/types/database';
import { 
  getSurfLessonPrice, 
  calculateFreeYogaDays, 
  calculateTransfersForGroup,
  calculateRetainedAndPendingValues 
} from './pricingRules';

export const calculatePrice = (input: CalculationInput, config: PricingConfig | PricingConfigData): CalculationResult => {
  const checkIn = new Date(input.checkInStart);
  const checkOut = new Date(input.checkInEnd);
  const numberOfNights = differenceInDays(checkOut, checkIn);
  const numberOfPeople = input.numberOfPeople;

  let result: CalculationResult = {
    numberOfNights,
    numberOfPeople,
    packageCost: 0,
    accommodationCost: 0,
    dailyItemsCost: 0,
    fixedItemsCost: 0,
    breakdown: {
      dailyItems: [],
      fixedItems: [],
    },
    totalCost: 0,
  };

  // 1. Verificar se há pacote selecionado
  const selectedPackage = input.packageId ? config.packages.find(p => p.id === input.packageId) : null;
  
  if (selectedPackage) {
    result.packageCost = selectedPackage.fixedPrice;
    result.breakdown.package = {
      name: selectedPackage.name,
      cost: selectedPackage.fixedPrice,
    };
  } else {
    // 2. Calcular hospedagem se não houver pacote
    const roomCategory = config.roomCategories.find(r => r.id === input.roomCategory);
    if (roomCategory) {
      const accommodationCost = roomCategory.billingType === 'per_person' 
        ? roomCategory.pricePerNight * numberOfNights * numberOfPeople
        : roomCategory.pricePerNight * numberOfNights;
      
      result.accommodationCost = accommodationCost;
      result.breakdown.accommodation = {
        description: `${roomCategory.name} - ${numberOfNights} noites${roomCategory.billingType === 'per_person' ? ` x ${numberOfPeople} pessoas` : ''}`,
        cost: accommodationCost,
      };
    }
  }

  // 3. Calcular itens diários (café da manhã, prancha)
  const packageIncludes = selectedPackage?.includedItems || {};

  // Café da manhã
  if (input.breakfast && !packageIncludes.breakfast) {
    const breakfastItem = config.items.find(item => item.id === 'breakfast');
    if (breakfastItem) {
      const cost = breakfastItem.price * numberOfNights * (breakfastItem.billingType === 'per_person' ? numberOfPeople : 1);
      result.dailyItemsCost += cost;
      result.breakdown.dailyItems.push({
        name: 'Café da manhã',
        quantity: numberOfNights * (breakfastItem.billingType === 'per_person' ? numberOfPeople : 1),
        unitPrice: breakfastItem.price,
        cost,
      });
    }
  }

  // Aluguel de prancha ilimitado
  if (input.unlimitedBoardRental && !packageIncludes.unlimitedBoardRental) {
    const boardItem = config.items.find(item => item.id === 'unlimited-board-rental');
    if (boardItem) {
      const cost = boardItem.price * numberOfNights * (boardItem.billingType === 'per_person' ? numberOfPeople : 1);
      result.dailyItemsCost += cost;
      result.breakdown.dailyItems.push({
        name: 'Aluguel prancha ilimitado',
        quantity: numberOfNights * (boardItem.billingType === 'per_person' ? numberOfPeople : 1),
        unitPrice: boardItem.price,
        cost,
      });
    }
  }

  // 4. Calcular itens fixos
  
  // Aulas de surf com faixas de preço
  if (input.surfLessons) {
    const includedLessons = packageIncludes.surfLessons || 0;
    const totalLessons = input.surfLessons;
    const extraLessons = Math.max(0, totalLessons - includedLessons);
    
    if (totalLessons > 0) {
      // Usar preço baseado na faixa para o total de aulas por pessoa
      const pricePerLesson = getSurfLessonPrice(totalLessons, (config as any).surfLessonPricing);
      const totalCost = pricePerLesson * totalLessons * numberOfPeople;
      
      result.fixedItemsCost += totalCost;
      result.breakdown.fixedItems.push({
        name: `Aulas de surf (${totalLessons} aulas por pessoa - faixa ${totalLessons <= 3 ? '1-3' : totalLessons <= 7 ? '4-7' : '8+'})`,
        quantity: totalLessons * numberOfPeople,
        unitPrice: pricePerLesson,
        cost: totalCost,
      });
    }
  }

  // Função helper para itens fixos simples
  const addFixedItem = (
    inputValue: number | undefined, 
    includedCount: number | undefined, 
    itemId: string, 
    name: string
  ) => {
    if (inputValue && inputValue > 0) {
      const extraCount = Math.max(0, inputValue - (includedCount || 0));
      
      if (extraCount > 0) {
        const item = config.items.find(i => i.id === itemId);
        
        if (item) {
          const cost = item.price * extraCount * (item.billingType === 'per_person' ? numberOfPeople : 1);
          
          result.fixedItemsCost += cost;
          result.breakdown.fixedItems.push({
            name: `${name} (${extraCount} ${extraCount === 1 ? 'sessão extra' : 'sessões extras'})`,
            quantity: extraCount * (item.billingType === 'per_person' ? numberOfPeople : 1),
            unitPrice: item.price,
            cost,
          });
        } else {
          console.log(`❌ Item não encontrado: ${itemId} - Itens disponíveis:`, config.items?.map(i => i.id));
        }
      }
    }
  };

  // Aulas de yoga com dias grátis
  if (input.yogaLessons && input.yogaLessons > 0) {
    const includedLessons = packageIncludes.yogaLessons || 0;
    const totalYogaLessons = input.yogaLessons;
    
    if (totalYogaLessons > 0) {
      // Calcular dias grátis de yoga (quartas e sextas)
      const freeYogaDays = calculateFreeYogaDays(input.checkInStart, input.checkInEnd);
      const chargedYogaLessons = Math.max(0, totalYogaLessons - freeYogaDays);
      
      if (chargedYogaLessons > 0) {
        const yogaItem = config.items.find(item => item.id === 'yoga-lesson');
        if (yogaItem) {
          const cost = yogaItem.price * chargedYogaLessons * numberOfPeople;
          result.fixedItemsCost += cost;
          result.breakdown.fixedItems.push({
            name: `Aulas de yoga (${chargedYogaLessons} aulas cobradas de ${totalYogaLessons} - ${freeYogaDays} dias grátis)`,
            quantity: chargedYogaLessons * numberOfPeople,
            unitPrice: yogaItem.price,
            cost,
          });
        }
      }
    }
  }
  addFixedItem(input.surfSkate, packageIncludes.surfSkate, 'surf-skate', 'Surf-skate');
  addFixedItem(input.videoAnalysis, packageIncludes.videoAnalysis, 'video-analysis', 'Análise de vídeo');
  addFixedItem(input.massage, packageIncludes.massage, 'massage', 'Massagem');
  addFixedItem(input.surfGuide, packageIncludes.surfGuide, 'surf-guide', 'Surf guide');

  // Transfer com regra para grupos maiores
  if (input.transfer) {
    // Calcular número de transfers baseado no número de pessoas
    const requiredTransfers = calculateTransfersForGroup(numberOfPeople);
    const includedTransfers = packageIncludes.transfer || 0;
    const extraTransfers = Math.max(0, requiredTransfers - includedTransfers);
    
    if (extraTransfers > 0) {
      const transferItem = config.items.find(item => item.id === 'transfer');
      if (transferItem) {
        const cost = transferItem.price * extraTransfers;
        result.fixedItemsCost += cost;
        result.breakdown.fixedItems.push({
          name: `Transfer (${extraTransfers} ${extraTransfers === 1 ? 'trecho' : 'trechos'} - ${numberOfPeople > 3 ? 'grupo > 3 pessoas' : 'grupo ≤ 3 pessoas'})`,
          quantity: extraTransfers,
          unitPrice: transferItem.price,
          cost,
        });
      }
    }
  }

  // Atividades
  const activities = [
    { key: 'hike', name: 'Trilha', value: input.hike, itemId: 'hike' },
    { key: 'rioCityTour', name: 'Rio City Tour', value: input.rioCityTour, itemId: 'rio-city-tour' },
    { key: 'cariocaExperience', name: 'Carioca Experience', value: input.cariocaExperience, itemId: 'carioca-experience' },
  ];

  activities.forEach(activity => {
    if (activity.value && activity.value > 0) {
      const item = config.items.find(i => i.id === activity.itemId);
      if (item) {
        const cost = item.price * activity.value * (item.billingType === 'per_person' ? numberOfPeople : 1);
        result.fixedItemsCost += cost;
        result.breakdown.fixedItems.push({
          name: activity.name,
          quantity: activity.value * (item.billingType === 'per_person' ? numberOfPeople : 1),
          unitPrice: item.price,
          cost,
        });
      }
    }
  });

  // Calcular total
  result.totalCost = result.packageCost + result.accommodationCost + result.dailyItemsCost + result.fixedItemsCost;

  // Calcular valor retido e valor pendente
  const servicesCost = result.fixedItemsCost; // Serviços (aulas, extras)
  const feeCost = 0; // Taxa sempre será acrescentada manualmente
  const accommodationCost = result.accommodationCost;
  const breakfastCost = result.dailyItemsCost; // Café da manhã e outros itens diários
  
  const { retainedValue, pendingValue } = calculateRetainedAndPendingValues(
    servicesCost,
    feeCost,
    accommodationCost,
    breakfastCost
  );

  // Adicionar informações ao resultado
  (result as any).retainedValue = retainedValue;
  (result as any).pendingValue = pendingValue;
  (result as any).servicesCost = servicesCost;
  (result as any).feeCost = feeCost;

  return result;
};