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

  // Separar custo do café da manhã de outros itens diários
  let breakfastOnlyCost = 0;

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
    // Buscar por ID ou por nome completo (ex: "Private: Double")
    let roomCategory = config.roomCategories.find(r => r.id === input.roomCategory);
    
    if (!roomCategory) {
      // Tentar buscar por nome se não encontrou por ID
      roomCategory = config.roomCategories.find(r => r.name === input.roomCategory);
    }
    
    console.log('🏠 Looking for room:', { 
      searchId: input.roomCategory, 
      found: roomCategory?.name,
      availableRooms: config.roomCategories.map(r => ({ id: r.id, name: r.name }))
    });
    
    if (roomCategory) {
      // Se pricePerNight for 0, o custo será definido manualmente no lead via accommodation_price_override
      const accommodationCost = roomCategory.pricePerNight * numberOfNights * 
        (roomCategory.billingType === 'per_person' ? numberOfPeople : 1);
      
      result.accommodationCost = accommodationCost;
      result.breakdown.accommodation = {
        description: accommodationCost === 0 
          ? `${roomCategory.name} - Valor a ser definido manualmente`
          : `${roomCategory.name} - ${numberOfNights} noites${roomCategory.billingType === 'per_person' ? ` x ${numberOfPeople} pessoas` : ''}`,
        cost: accommodationCost,
      };
      
      console.log('✅ Accommodation calculated:', result.accommodationCost, '(0 = manual pricing)');
    } else {
      console.log('❌ No room category found for:', input.roomCategory);
    }
  }

  // 3. Calcular itens diários (café da manhã, prancha)
  const packageIncludes = selectedPackage?.includedItems || {};

  // Café da manhã (vai para valor pendente)
  if (input.breakfast && !packageIncludes.breakfast) {
    const breakfastItem = config.items.find(item => item.id === 'breakfast');
    if (breakfastItem) {
      const cost = breakfastItem.price * numberOfNights * (breakfastItem.billingType === 'per_person' ? numberOfPeople : 1);
      result.dailyItemsCost += cost;
      breakfastOnlyCost = cost; // Salvar custo apenas do café da manhã
      result.breakdown.dailyItems.push({
        name: 'Café da manhã',
        quantity: numberOfNights * (breakfastItem.billingType === 'per_person' ? numberOfPeople : 1),
        unitPrice: breakfastItem.price,
        cost,
      });
    }
  }

  // Aluguel de prancha ilimitado (vai para valor depósito, como serviço)
  if (input.unlimitedBoardRental && !packageIncludes.unlimitedBoardRental) {
    const boardItem = config.items.find(item => item.id === 'unlimited-board-rental');
    if (boardItem) {
      const cost = boardItem.price * numberOfNights * (boardItem.billingType === 'per_person' ? numberOfPeople : 1);
      // Mover para fixedItemsCost ao invés de dailyItemsCost
      result.fixedItemsCost += cost;
      result.breakdown.fixedItems.push({
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
      // Calcular TOTAL de aulas (por pessoa x número de pessoas) para determinar faixa
      const totalSurfLessons = totalLessons * numberOfPeople;
      // Usar preço baseado na faixa do TOTAL de aulas
      const pricePerLesson = getSurfLessonPrice(totalSurfLessons, (config as any).surfLessonPricing);
      const totalCost = pricePerLesson * totalSurfLessons;
      
      result.fixedItemsCost += totalCost;
      result.breakdown.fixedItems.push({
        name: `Aulas de surf (${totalLessons} aulas por pessoa x ${numberOfPeople} ${numberOfPeople > 1 ? 'pessoas' : 'pessoa'} = ${totalSurfLessons} total - faixa ${totalSurfLessons <= 3 ? '1-3' : totalSurfLessons <= 7 ? '4-7' : '8+'})`,
        quantity: totalSurfLessons,
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
      
      const yogaItem = config.items.find(item => item.id === 'yoga-lesson');
      if (yogaItem) {
        const cost = yogaItem.price * chargedYogaLessons * numberOfPeople;
        
        // Sempre adicionar ao breakdown, mesmo que custo seja 0, para mostrar na aba de preços
        result.fixedItemsCost += cost;
        
        // Mensagem diferente dependendo se há aulas grátis
        let yogaName = '';
        if (freeYogaDays > 0 && chargedYogaLessons > 0) {
          yogaName = `Aulas de yoga (${totalYogaLessons} total: ${freeYogaDays} grátis + ${chargedYogaLessons} cobradas)`;
        } else if (freeYogaDays > 0 && chargedYogaLessons === 0) {
          yogaName = `Aulas de yoga (${totalYogaLessons} aulas - todas grátis)`;
        } else {
          yogaName = `Aulas de yoga (${totalYogaLessons} aulas)`;
        }
        
        result.breakdown.fixedItems.push({
          name: yogaName,
          quantity: chargedYogaLessons * numberOfPeople,
          unitPrice: yogaItem.price,
          cost,
        });
      }
    }
  }
  addFixedItem(input.surfSkate, packageIncludes.surfSkate, 'surf-skate', 'Surf-skate');
  addFixedItem(input.videoAnalysis, packageIncludes.videoAnalysis, 'video-analysis', 'Análise de vídeo');
  addFixedItem(input.massage, packageIncludes.massage, 'massage', 'Massagem');
  addFixedItem(input.surfGuide, packageIncludes.surfGuide, 'surf-guide', 'Surf guide');

  // Transfer - usar a quantidade definida pelo usuário
  if (input.transfer && input.transfer > 0) {
    const includedTransfers = packageIncludes.transfer || 0;
    const totalTransfers = input.transfer; // Já inclui transfer_extra + transfer_package + transfer
    const transfersToCobrar = Math.max(0, totalTransfers - includedTransfers);
    
    if (transfersToCobrar > 0) {
      const transferItem = config.items.find(item => item.id === 'transfer');
      if (transferItem) {
        const cost = transferItem.price * transfersToCobrar;
        result.fixedItemsCost += cost;
        
        let transferDescription = `Transfer (${transfersToCobrar} ${transfersToCobrar === 1 ? 'trecho' : 'trechos'}`;
        if (includedTransfers > 0) {
          transferDescription += ` - ${includedTransfers} incluído${includedTransfers > 1 ? 's' : ''} no pacote`;
        }
        transferDescription += ')';
        
        result.breakdown.fixedItems.push({
          name: transferDescription,
          quantity: transfersToCobrar,
          unitPrice: transferItem.price,
          cost,
        });
      }
    } else if (totalTransfers > 0 && includedTransfers >= totalTransfers) {
      // Mostrar na aba de preços mesmo que seja grátis (incluído no pacote)
      const transferItem = config.items.find(item => item.id === 'transfer');
      if (transferItem) {
        result.breakdown.fixedItems.push({
          name: `Transfer (${totalTransfers} ${totalTransfers === 1 ? 'trecho' : 'trechos'} - incluído${totalTransfers > 1 ? 's' : ''} no pacote)`,
          quantity: 0,
          unitPrice: transferItem.price,
          cost: 0,
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
  const servicesCost = result.packageCost + result.fixedItemsCost; // Pacote + Serviços (aulas, extras, prancha)
  const feeCost = 0; // Taxa sempre será acrescentada manualmente
  const accommodationCost = result.accommodationCost;
  const breakfastCost = breakfastOnlyCost; // APENAS café da manhã (não inclui prancha)
  
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
  (result as any).breakfastOnlyCost = breakfastOnlyCost; // Exportar para uso no modal

  return result;
};