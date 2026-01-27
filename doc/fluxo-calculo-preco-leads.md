# Fluxo de Cálculo do Valor dos Leads

## Visão Geral

O sistema calcula o valor de cada lead em **tempo real** sempre que os dados são carregados ou modificados. O cálculo é feito **client-side** (no navegador) e **não é persistido no banco de dados**. Apenas os dados de entrada do lead são salvos, e o preço é recalculado dinamicamente sempre que necessário.

## Quando o Cálculo é Disparado

### 1. **Carregamento de Leads**
Quando os leads são buscados do banco de dados, o cálculo é executado automaticamente para cada lead:

```38:38:src/pages/Leads.tsx
      return data.map(lead => calculateLeadPrice(lead, config));
```

**Localização:** `src/pages/Leads.tsx` - Query de busca de leads

### 2. **Modificação de Dados do Lead**
Sempre que um campo do lead é alterado no formulário, o preço é recalculado em tempo real:

```294:301:src/components/leads/CompleteLeadModal.tsx
    // Recalcular preço em tempo real
    if (lead) {
      const updatedLead = { ...lead, ...updatedData };
      console.log('💰 Recalculating price with:', { tipo_de_quarto: updatedLead.tipo_de_quarto });
      const newCalculation = calculateLeadPrice(updatedLead, config);
      console.log('💰 New calculation:', newCalculation);
      setCalculatedLead(newCalculation);
    }
```

**Localização:** `src/components/leads/CompleteLeadModal.tsx` - Função `handleInputChange`

### 3. **Abertura do Modal de Detalhes**
Quando o modal de detalhes do lead é aberto, o cálculo é executado:

```56:56:src/components/leads/LeadDetailModal.tsx
      setCalculatedLead(calculateLeadPrice(lead, config));
```

**Localização:** `src/components/leads/LeadDetailModal.tsx` - Hook `useEffect`

### 4. **Criação de Novo Lead**
Ao criar um novo lead, o cálculo é executado com os valores padrão:

```78:78:src/pages/Leads.tsx
    setNewLead(calculateLeadPrice(emptyLead as any, config));
```

**Localização:** `src/pages/Leads.tsx` - Função `handleCreateLead`

## Como o Cálculo Funciona

### Fluxo de Cálculo

1. **Conversão dos Dados do Lead**
   - Os dados do lead são convertidos para o formato de entrada do cálculo
   - Função: `convertLeadToCalculationInput()` em `src/types/leads.ts`

2. **Cálculo do Preço**
   - A função `calculatePrice()` processa todos os itens e serviços
   - Função principal: `calculatePrice()` em `src/utils/priceCalculator.ts`

3. **Resultado**
   - Retorna um objeto `LeadWithCalculation` com:
     - `calculatedPrice`: Objeto completo com breakdown detalhado
     - `totalPrice`: Valor total calculado

### Componentes do Cálculo

#### 1. **Hospedagem (Accommodation)**
- Calculado baseado em:
  - Tipo de quarto (`roomCategory`)
  - Número de noites (diferença entre check-in e check-out)
  - Tipo de cobrança (`per_room` ou `per_person`)
  - Número de pessoas (se `per_person`)

```58:74:src/utils/priceCalculator.ts
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
```

**Observação:** Se `pricePerNight` for 0, o valor deve ser definido manualmente via `accommodation_price_override`.

#### 2. **Itens Diários**
- **Café da manhã:** Calculado por noite × número de pessoas
- **Aluguel de prancha:** Calculado por noite × número de pessoas

```82:101:src/utils/priceCalculator.ts
  // Café da manhã (vai para valor pendente) - SEMPRE calcular se solicitado
  if (input.breakfast && input.breakfast > 0) {
    const breakfastItem = config.items.find(item => item.id === 'breakfast');
    if (breakfastItem) {
      const cost = breakfastItem.price * numberOfNights * (breakfastItem.billingType === 'per_person' ? numberOfPeople : 1);
      result.dailyItemsCost += cost;
      breakfastOnlyCost = cost; // Salvar custo apenas do café da manhã
      
      let breakfastName = 'Café da manhã';
      if (packageIncludes.breakfast) {
        breakfastName += ' (incluído no pacote)';
      }
      
      result.breakdown.dailyItems.push({
        name: breakfastName,
        quantity: numberOfNights * (breakfastItem.billingType === 'per_person' ? numberOfPeople : 1),
        unitPrice: breakfastItem.price,
        cost,
      });
    }
  }
```

#### 3. **Itens Fixos (Serviços)**
- **Aulas de surf:** Preço varia por faixa (1-3, 4-7, 8+ aulas)
- **Aulas de yoga:** Dias grátis nas quartas e sextas-feiras
- **Análise de vídeo:** Sempre multiplicado por número de pessoas
- **Massagem:** Soma de extras + pacote
- **Transfer:** Calculado por veículo (acima de 3 pessoas = 2 veículos)
- **Outros serviços:** Skate, surf guide, trilha, tours, etc.

```128:153:src/utils/priceCalculator.ts
  // Aulas de surf com faixas de preço - SEMPRE calcular se solicitado
  if (input.surfLessons && input.surfLessons > 0) {
    const includedLessons = packageIncludes.surfLessons || 0;
    const totalLessons = input.surfLessons;
    
    if (totalLessons > 0) {
      // Calcular TOTAL de aulas (por pessoa x número de pessoas) para determinar faixa
      const totalSurfLessons = totalLessons * numberOfPeople;
      // Usar preço baseado na faixa do TOTAL de aulas
      const pricePerLesson = getSurfLessonPrice(totalSurfLessons, (config as any).surfLessonPricing);
      const totalCost = pricePerLesson * totalSurfLessons;
      
      result.fixedItemsCost += totalCost;
      
      let surfName = `Aulas de surf (${totalLessons} aulas por pessoa x ${numberOfPeople} ${numberOfPeople > 1 ? 'pessoas' : 'pessoa'} = ${totalSurfLessons} total - faixa ${totalSurfLessons <= 3 ? '1-3' : totalSurfLessons <= 7 ? '4-7' : '8+'})`;
      if (includedLessons > 0) {
        surfName += ` (${includedLessons} incluídas no pacote)`;
      }
      
      result.breakdown.fixedItems.push({
        name: surfName,
        quantity: totalSurfLessons,
        unitPrice: pricePerLesson,
        cost: totalCost,
      });
    }
  }
```

#### 4. **Pacotes**
- Os pacotes **não adicionam custo** ao cálculo
- Apenas servem como referência para itens incluídos
- O valor do pacote não é somado ao total

```37:41:src/utils/priceCalculator.ts
  // IMPORTANTE: Não incluir valor do pacote no cálculo - apenas usar para referência dos itens incluídos
  if (selectedPackage) {
    // Não adicionar ao custo total - apenas referenciar para saber o que está incluído
    result.packageCost = 0; // Zerar custo do pacote
    // Não adicionar ao breakdown para não aparecer na aba de preços
```

### Regras Especiais de Cálculo

#### Aulas de Surf - Faixas de Preço
- **1-3 aulas:** Preço tier1 (padrão: R$ 180)
- **4-7 aulas:** Preço tier2 (padrão: R$ 160)
- **8+ aulas:** Preço tier3 (padrão: R$ 140)
- A faixa é determinada pelo **total de aulas** (aulas por pessoa × número de pessoas)

```10:21:src/utils/pricingRules.ts
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
```

#### Aulas de Yoga - Dias Grátis
- Yoga é **grátis** nas quartas e sextas-feiras às 7h
- Sexta-feira **sempre conta como grátis**, mesmo no dia do check-out
- Quarta-feira não conta se for no dia do check-out
- O dia do check-in não conta (check-in às 11h, yoga às 7h)

```34:82:src/utils/pricingRules.ts
export function calculateFreeYogaDays(checkInStart: string, checkInEnd: string): number {
  // Extrair apenas a parte da data (YYYY-MM-DD) sem conversão de timezone
  const startDateStr = checkInStart.includes('T') ? checkInStart.split('T')[0] : checkInStart;
  const endDateStr = checkInEnd.includes('T') ? checkInEnd.split('T')[0] : checkInEnd;
  
  // Criar datas usando os componentes para evitar problemas de timezone
  const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
  
  const start = new Date(startYear, startMonth - 1, startDay); // Mês é 0-indexed
  const end = new Date(endYear, endMonth - 1, endDay);
  
  // Normalizar datas para comparar apenas dia/mês/ano (sem hora)
  const normalizeDate = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };
  
  const normalizedStart = normalizeDate(start);
  const normalizedEnd = normalizeDate(end);
  
  let freeDays = 0;
  // Pular o primeiro dia (dia do check-in) pois o check-in é às 11h e yoga às 7h
  const current = new Date(normalizedStart);
  current.setDate(current.getDate() + 1);
  
  // Iterar através de cada dia entre check-in+1 e check-out (incluindo check-out)
  while (current <= normalizedEnd) {
    const dayOfWeek = getDay(current); // 0 = domingo, 1 = segunda, ..., 3 = quarta, 5 = sexta, 6 = sábado
    const currentNormalized = normalizeDate(current);
    const isCheckOutDay = currentNormalized.getTime() === normalizedEnd.getTime();
    
    // Quarta-feira = 3, Sexta-feira = 5
    // Sexta-feira e Quarta-feira SEMPRE contam como grátis, mesmo no check-out
    if (dayOfWeek === 5) {
      // Sexta-feira: sempre grátis
      freeDays++;
      console.log(`📅 Yoga grátis em: ${format(current, 'dd/MM/yyyy (EEEE)', { locale: ptBR })}${isCheckOutDay ? ' [CHECK-OUT]' : ''}`);
    } else if (dayOfWeek === 3) {
      // Quarta-feira: também grátis mesmo no check-out
      freeDays++;
      console.log(`📅 Yoga grátis em: ${format(current, 'dd/MM/yyyy (EEEE)', { locale: ptBR })}${isCheckOutDay ? ' [CHECK-OUT]' : ''}`);
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  console.log(`🧘 Total de dias de yoga grátis: ${freeDays} (entre ${startDateStr} e ${endDateStr}, excluindo dia do check-in, sexta sempre grátis mesmo no check-out)`);
  return freeDays;
}
```

#### Transfer - Cálculo por Veículo
- **Até 3 pessoas:** 1 veículo
- **Acima de 3 pessoas:** 2 veículos
- O cálculo considera o número de veículos necessários por trecho

```90:95:src/utils/pricingRules.ts
export function calculateTransfersForGroup(numberOfPeople: number): number {
  if (!numberOfPeople || numberOfPeople <= 0) {
    return 1; // fallback seguro
  }
  return Math.max(1, Math.ceil(numberOfPeople / 3));
}
```

### Valor Retido vs Valor Pendente

O sistema calcula automaticamente:
- **Valor Retido:** Serviços + Taxa (cobrado antecipadamente)
- **Valor Pendente:** Hospedagem + Café da manhã (cobrado depois)

```105:118:src/utils/pricingRules.ts
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
```

## Como os Valores São Registrados

### ⚠️ IMPORTANTE: Valores Calculados NÃO São Salvos

O preço calculado **não é persistido no banco de dados**. Apenas os dados de entrada do lead são salvos:

```305:309:src/components/leads/CompleteLeadModal.tsx
  const handleSave = () => {
    // Remover campos calculados que não existem no banco
    const { calculatedPrice, totalPrice, ...dataToSave } = formData;
    updateMutation.mutate(dataToSave);
  };
```

### Campos Salvos no Banco de Dados

Os seguintes campos são salvos na tabela `reservations`:

#### Dados Básicos
- `name`, `email`, `telefone`
- `status`
- `check_in_start`, `check_in_end`
- `number_of_people`
- `tipo_de_quarto`, `room_category`, `room_type`
- `pacote`

#### Atividades e Serviços
- `aulas_de_surf`, `aulas_de_yoga`
- `skate`
- `analise_de_video`, `analise_de_video_package`
- `massagem_extra`, `massagem_package`
- `surf_guide_package`
- `transfer_extra`, `transfer_package`
- `breakfast` (boolean)
- `aluguel_de_prancha` (boolean)
- `hike_extra`, `rio_city_tour`, `carioca_experience` (boolean)

#### Ajustes Manuais de Preço
- `accommodation_price_override`: Valor manual da hospedagem (quando `pricePerNight` é 0)
- `extra_fee_amount`: Taxa extra a ser adicionada ao total
- `extra_fee_description`: Descrição da taxa extra

### Ajustes Manuais no Cálculo

Quando há ajustes manuais, eles são aplicados ao valor calculado:

```189:218:src/types/leads.ts
export function getLeadDisplayPrice(lead: LeadWithCalculation): string {
  let totalPrice = lead.totalPrice || 0;
  
  // Se houver calculatedPrice, usar o valor de lá
  if (lead.calculatedPrice) {
    totalPrice = lead.calculatedPrice.totalCost || 0;
    
    // Adicionar ajuste de hospedagem se houver override definido
    // Note: accommodationCost pode ser 0 (para definição manual), então verificamos !== undefined
    if (lead.accommodation_price_override !== null && lead.accommodation_price_override !== undefined) {
      const originalAccommodationCost = lead.calculatedPrice.accommodationCost || 0;
      const adjustment = lead.accommodation_price_override - originalAccommodationCost;
      totalPrice += adjustment;
    }
    
    // Adicionar taxa extra se houver
    if (lead.extra_fee_amount) {
      totalPrice += lead.extra_fee_amount;
    }
  }
  
  if (totalPrice > 0) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(totalPrice);
  }

  return "Orçamento pendente";
}
```

## Estrutura do Resultado do Cálculo

O resultado do cálculo é um objeto `CalculationResult`:

```75:97:src/types/pricing.ts
export interface CalculationResult {
  numberOfNights: number;
  numberOfPeople: number;
  
  packageCost: number;
  accommodationCost: number;
  dailyItemsCost: number;
  fixedItemsCost: number;
  
  breakdown: {
    package?: { name: string; cost: number };
    accommodation?: { description: string; cost: number };
    dailyItems: Array<{ name: string; quantity: number; unitPrice: number; cost: number }>;
    fixedItems: Array<{ name: string; quantity: number; unitPrice: number; cost: number }>;
  };
  
  totalCost: number;
  // Novos campos para valor retido e pendente
  retainedValue?: number;
  pendingValue?: number;
  servicesCost?: number;
  feeCost?: number;
}
```

## Configuração de Preços

### ✅ Configuração É Salva no Banco de Dados

**SIM**, os valores configurados na página de Calculadora (aba "Configurações") **são salvos no banco de dados** na tabela `pricing_config`.

### Como Funciona o Salvamento

1. **Edição na Página de Calculadora:**
   - O usuário edita os valores na aba "Configurações" da página Calculadora
   - As alterações ficam em estado local (`localConfig`) até serem salvas

2. **Salvamento:**
   - Ao clicar em "Salvar Alterações", a função `handleSave()` é chamada
   - Isso dispara `onUpdateConfig(localConfig)` que chama a mutation `updateConfigMutation`

3. **Persistência no Banco:**
   - A mutation faz um `UPDATE` na tabela `pricing_config` se já existe uma configuração
   - Ou um `INSERT` se é a primeira configuração

```77:80:src/components/calculator/PricingConfigForm.tsx
  const handleSave = () => {
    onUpdateConfig(localConfig);
    setHasChanges(false);
  };
```

```167:212:src/hooks/usePricingConfig.ts
  // Atualizar configuração
  const updateConfigMutation = useMutation({
    mutationFn: async (newConfig: PricingConfigData) => {
      if (!config) {
        // Criar nova configuração
        const { data, error } = await supabase
          .from('pricing_config')
          .insert({
            name: 'Configuração Atualizada',
            description: 'Configuração de preços atualizada',
            room_categories: newConfig.roomCategories,
            packages: newConfig.packages,
            items: newConfig.items,
            surf_lesson_pricing: newConfig.surfLessonPricing,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Atualizar configuração existente
        const { data, error } = await supabase
          .from('pricing_config')
          .update({
            room_categories: newConfig.roomCategories,
            packages: newConfig.packages,
            items: newConfig.items,
            surf_lesson_pricing: newConfig.surfLessonPricing,
            updated_at: new Date().toISOString(),
          })
          .eq('id', config.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-config'] });
      toast.success('Configuração de preços atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar configuração: ' + error.message);
    },
  });
```

### Estrutura da Tabela `pricing_config`

A tabela armazena os seguintes dados em formato JSONB:

- **`room_categories`:** Array de tipos de quarto com preços e tipo de cobrança
- **`packages`:** Array de pacotes com itens incluídos
- **`items`:** Array de itens de cobrança (serviços, atividades, etc.)
- **`surf_lesson_pricing`:** Objeto com faixas de preço para aulas de surf (tier1, tier2, tier3)

### Carregamento da Configuração

A configuração é carregada do banco de dados através do hook `usePricingConfig`:

```33:63:src/hooks/usePricingConfig.ts
export const usePricingConfig = () => {
  const queryClient = useQueryClient();

  // Buscar configuração ativa
  const { data: config, isLoading, error } = useQuery({
    queryKey: ['pricing-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_config')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // Se não encontrar configuração ativa, buscar a primeira disponível
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('pricing_config')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (fallbackError) throw fallbackError;
        return fallbackData;
      }

      return data;
    },
  });
```

**Importante:**
- O sistema busca a configuração com `is_active = true`
- Se não encontrar, busca a mais recente como fallback
- A configuração carregada é usada para calcular os preços de todos os leads

## Resumo do Fluxo Completo

1. **Carregamento:** Leads são buscados do banco → Cálculo executado para cada lead
2. **Edição:** Usuário modifica campo → Cálculo executado em tempo real
3. **Visualização:** Modal aberto → Cálculo executado
4. **Salvamento:** Apenas dados de entrada são salvos (campos calculados removidos)
5. **Exibição:** Valor total é calculado dinamicamente incluindo ajustes manuais

## Arquivos Principais

- **Cálculo principal:** `src/utils/priceCalculator.ts`
- **Regras de negócio:** `src/utils/pricingRules.ts`
- **Conversão de dados:** `src/types/leads.ts` (funções `convertLeadToCalculationInput` e `calculateLeadPrice`)
- **Tipos:** `src/types/pricing.ts`
- **Configuração:** `src/hooks/usePricingConfig.ts`
- **Componentes:** 
  - `src/components/leads/CompleteLeadModal.tsx`
  - `src/components/leads/LeadDetailModal.tsx`
  - `src/pages/Leads.tsx`

