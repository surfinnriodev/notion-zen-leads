import { differenceInDays } from 'date-fns';
import { PricingConfig, CalculationInput, CalculationResult } from '@/types/pricing';

export const calculatePrice = (input: CalculationInput, config: PricingConfig): CalculationResult => {
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
      const accommodationCost = roomCategory.perPerson 
        ? roomCategory.pricePerNight * numberOfNights * numberOfPeople
        : roomCategory.pricePerNight * numberOfNights;
      
      result.accommodationCost = accommodationCost;
      result.breakdown.accommodation = {
        description: `${roomCategory.name} - ${numberOfNights} noites${roomCategory.perPerson ? ` x ${numberOfPeople} pessoas` : ''}`,
        cost: accommodationCost,
      };
    }
  }

  // 3. Calcular itens diários (café da manhã, prancha)
  const packageIncludes = selectedPackage?.includedItems || {};

  // Café da manhã
  if (input.breakfast && !packageIncludes.breakfast) {
    const breakfastConfig = config.dailyItems.breakfast;
    const cost = breakfastConfig.price * numberOfNights * (breakfastConfig.perPerson ? numberOfPeople : 1);
    result.dailyItemsCost += cost;
    result.breakdown.dailyItems.push({
      name: 'Café da manhã',
      quantity: numberOfNights * (breakfastConfig.perPerson ? numberOfPeople : 1),
      unitPrice: breakfastConfig.price,
      cost,
    });
  }

  // Aluguel de prancha ilimitado
  if (input.unlimitedBoardRental && !packageIncludes.unlimitedBoardRental) {
    const boardConfig = config.dailyItems.unlimitedBoardRental;
    const cost = boardConfig.price * numberOfNights * (boardConfig.perPerson ? numberOfPeople : 1);
    result.dailyItemsCost += cost;
    result.breakdown.dailyItems.push({
      name: 'Aluguel prancha ilimitado',
      quantity: numberOfNights * (boardConfig.perPerson ? numberOfPeople : 1),
      unitPrice: boardConfig.price,
      cost,
    });
  }

  // 4. Calcular itens fixos
  
  // Aulas de surf (com faixas)
  if (input.surfLessons) {
    const includedLessons = packageIncludes.surfLessons || 0;
    const extraLessons = Math.max(0, input.surfLessons - includedLessons);
    
    if (extraLessons > 0) {
      let tierConfig;
      if (extraLessons <= 3) {
        tierConfig = config.fixedItems.surfLessons.tier1_3;
      } else if (extraLessons <= 7) {
        tierConfig = config.fixedItems.surfLessons.tier4_7;
      } else {
        tierConfig = config.fixedItems.surfLessons.tier8plus;
      }
      
      const cost = tierConfig.price * extraLessons * (tierConfig.perPerson ? numberOfPeople : 1);
      result.fixedItemsCost += cost;
      result.breakdown.fixedItems.push({
        name: `Aulas de surf (${extraLessons} aulas extras)`,
        quantity: extraLessons * (tierConfig.perPerson ? numberOfPeople : 1),
        unitPrice: tierConfig.price,
        cost,
      });
    }
  }

  // Função helper para itens fixos simples
  const addFixedItem = (
    inputValue: number | undefined, 
    includedCount: number | undefined, 
    config: { price: number; perPerson: boolean }, 
    name: string
  ) => {
    if (inputValue) {
      const extraCount = Math.max(0, inputValue - (includedCount || 0));
      if (extraCount > 0) {
        const cost = config.price * extraCount * (config.perPerson ? numberOfPeople : 1);
        result.fixedItemsCost += cost;
        result.breakdown.fixedItems.push({
          name: `${name} (${extraCount} ${extraCount === 1 ? 'sessão extra' : 'sessões extras'})`,
          quantity: extraCount * (config.perPerson ? numberOfPeople : 1),
          unitPrice: config.price,
          cost,
        });
      }
    }
  };

  // Aplicar para outros itens fixos
  addFixedItem(input.yogaLessons, packageIncludes.yogaLessons, config.fixedItems.yogaLessons, 'Aulas de yoga');
  addFixedItem(input.surfSkate, packageIncludes.surfSkate, config.fixedItems.surfSkate, 'Surf-skate');
  addFixedItem(input.videoAnalysis, packageIncludes.videoAnalysis, config.fixedItems.videoAnalysis, 'Análise de vídeo');
  addFixedItem(input.massage, packageIncludes.massage, config.fixedItems.massage, 'Massagem');
  addFixedItem(input.surfGuide, packageIncludes.surfGuide, config.fixedItems.surfGuide, 'Surf guide');

  // Transfer (por reserva)
  if (input.transfer) {
    const extraTransfer = Math.max(0, input.transfer - (packageIncludes.transfer || 0));
    if (extraTransfer > 0) {
      const cost = config.fixedItems.transfer.price * extraTransfer;
      result.fixedItemsCost += cost;
      result.breakdown.fixedItems.push({
        name: `Transfer (${extraTransfer} ${extraTransfer === 1 ? 'trecho extra' : 'trechos extras'})`,
        quantity: extraTransfer,
        unitPrice: config.fixedItems.transfer.price,
        cost,
      });
    }
  }

  // Atividades
  const activities = [
    { key: 'hike', name: 'Trilha', value: input.hike, config: config.fixedItems.activities.hike },
    { key: 'rioCityTour', name: 'Rio City Tour', value: input.rioCityTour, config: config.fixedItems.activities.rioCityTour },
    { key: 'cariocaExperience', name: 'Carioca Experience', value: input.cariocaExperience, config: config.fixedItems.activities.cariocaExperience },
  ];

  activities.forEach(activity => {
    if (activity.value && activity.value > 0) {
      const cost = activity.config.price * activity.value * (activity.config.perPerson ? numberOfPeople : 1);
      result.fixedItemsCost += cost;
      result.breakdown.fixedItems.push({
        name: activity.name,
        quantity: activity.value * (activity.config.perPerson ? numberOfPeople : 1),
        unitPrice: activity.config.price,
        cost,
      });
    }
  });

  // Calcular total
  result.totalCost = result.packageCost + result.accommodationCost + result.dailyItemsCost + result.fixedItemsCost;

  return result;
};