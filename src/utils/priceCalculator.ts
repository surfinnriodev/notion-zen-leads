import { differenceInDays } from 'date-fns';
import { PricingConfig, CalculationInput, CalculationResult } from '@/types/pricing';
import { PricingConfigData } from '@/types/database';

export const calculatePrice = (input: CalculationInput, config: PricingConfig | PricingConfigData): CalculationResult => {
  console.log("🚀 Iniciando cálculo de preço");
  console.log("📊 Input recebido:", input);
  console.log("🏨 Config recebida:", config);
  console.log("📋 Itens disponíveis na config:", config.items?.map(i => ({ id: i.id, name: i.name, price: i.price })));
  
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
    const boardItem = config.items.find(item => item.id === 'aluguel_prancha');
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
  
  // Aulas de surf
  if (input.surfLessons) {
    const includedLessons = packageIncludes.surfLessons || 0;
    const extraLessons = Math.max(0, input.surfLessons - includedLessons);
    
    if (extraLessons > 0) {
      const surfItem = config.items.find(item => item.id === 'aulas_de_surf');
      if (surfItem) {
        const cost = surfItem.price * extraLessons * (surfItem.billingType === 'per_person' ? numberOfPeople : 1);
        result.fixedItemsCost += cost;
        result.breakdown.fixedItems.push({
          name: `Aulas de surf (${extraLessons} aulas extras)`,
          quantity: extraLessons * (surfItem.billingType === 'per_person' ? numberOfPeople : 1),
          unitPrice: surfItem.price,
          cost,
        });
      }
    }
  }

  // Função helper para itens fixos simples
  const addFixedItem = (
    inputValue: number | undefined, 
    includedCount: number | undefined, 
    itemId: string, 
    name: string
  ) => {
    console.log(`🔍 Verificando item: ${name} (${itemId})`);
    console.log(`📊 Input value: ${inputValue}, Included: ${includedCount}`);
    
    if (inputValue && inputValue > 0) {
      const extraCount = Math.max(0, inputValue - (includedCount || 0));
      console.log(`📈 Extra count: ${extraCount}`);
      
      if (extraCount > 0) {
        const item = config.items.find(i => i.id === itemId);
        console.log(`🎯 Item encontrado:`, item);
        
        if (item) {
          const cost = item.price * extraCount * (item.billingType === 'per_person' ? numberOfPeople : 1);
          console.log(`💰 Custo calculado: ${cost} (preço: ${item.price}, quantidade: ${extraCount}, pessoas: ${numberOfPeople})`);
          
          result.fixedItemsCost += cost;
          result.breakdown.fixedItems.push({
            name: `${name} (${extraCount} ${extraCount === 1 ? 'sessão extra' : 'sessões extras'})`,
            quantity: extraCount * (item.billingType === 'per_person' ? numberOfPeople : 1),
            unitPrice: item.price,
            cost,
          });
        } else {
          console.log(`❌ Item não encontrado: ${itemId}`);
          console.log(`📋 Itens disponíveis:`, config.items.map(i => i.id));
        }
      }
    }
  };

  // Aplicar para outros itens fixos
  addFixedItem(input.yogaLessons, packageIncludes.yogaLessons, 'aulas_de_yoga', 'Aulas de yoga');
  addFixedItem(input.surfSkate, packageIncludes.surfSkate, 'skate', 'Surf-skate');
  addFixedItem(input.videoAnalysis, packageIncludes.videoAnalysis, 'analise_de_video', 'Análise de vídeo');
  addFixedItem(input.massage, packageIncludes.massage, 'massagem_extra', 'Massagem');
  addFixedItem(input.surfGuide, packageIncludes.surfGuide, 'surf_guide', 'Surf guide');

  // Transfer (por reserva)
  if (input.transfer) {
    const extraTransfer = Math.max(0, input.transfer - (packageIncludes.transfer || 0));
    if (extraTransfer > 0) {
      const transferItem = config.items.find(item => item.id === 'transfer');
      if (transferItem) {
        const cost = transferItem.price * extraTransfer;
        result.fixedItemsCost += cost;
        result.breakdown.fixedItems.push({
          name: `Transfer (${extraTransfer} ${extraTransfer === 1 ? 'trecho extra' : 'trechos extras'})`,
          quantity: extraTransfer,
          unitPrice: transferItem.price,
          cost,
        });
      }
    }
  }

  // Atividades
  const activities = [
    { key: 'hike', name: 'Trilha', value: input.hike, itemId: 'hike_extra' },
    { key: 'rioCityTour', name: 'Rio City Tour', value: input.rioCityTour, itemId: 'rio_city_tour' },
    { key: 'cariocaExperience', name: 'Carioca Experience', value: input.cariocaExperience, itemId: 'carioca_experience' },
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

  return result;
};