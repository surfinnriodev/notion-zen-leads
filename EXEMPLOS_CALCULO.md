# 📊 Exemplos de Cálculo - Regras Implementadas

## ✅ Regras Implementadas

### 1. **Faixas de Preço para Aulas de Surf**
- **1-3 aulas**: R$ 180 por aula/pessoa
- **4-7 aulas**: R$ 160 por aula/pessoa  
- **8+ aulas**: R$ 140 por aula/pessoa

### 2. **Yoga Grátis nas Quartas e Sextas**
- Yoga é grátis nas quartas e sextas-feiras
- Cálculo automático baseado nas datas de check-in e check-out

### 3. **Transfer para Grupos Maiores**
- **≤ 3 pessoas**: 1 transfer
- **> 3 pessoas**: 2 transfers

### 4. **Valor Retido vs Valor Pendente**
- **Valor Retido** = Serviços + Taxa
- **Valor Pendente** = Hospedagem + Café da manhã

## 📋 Exemplo 1: Emilie Jones (Conforme Documento)

**Dados:**
- Pessoas: 2
- Período: 18/12/2025 → 25/12/2025 (7 noites)
- Aulas de Surf: 5 por pessoa
- Aulas de Yoga: 1 por pessoa

**Cálculos Implementados:**

### Aulas de Surf
- 5 aulas por pessoa → Faixa 4-7 aulas → R$ 160 por aula
- Total: 10 aulas × R$ 160 = **R$ 1.600,00**

### Yoga
- Período: 18/12 (Quarta) → 25/12 (Quarta)
- Dias grátis disponíveis: 2 (Quarta 18/12 e Sexta 20/12)
- Aulas solicitadas: 1 por pessoa
- Aulas cobradas: max(0, 1 - 2) = **0 aulas cobradas**
- Total Yoga: **R$ 0,00**

### Totais
- **Subtotal serviços**: R$ 1.600,00
- **Hospedagem**: R$ 3.538,75
- **Taxa**: R$ 1.161,25 (manual)
- **Total geral**: R$ 6.300,00
- **Valor Retido**: R$ 2.761,25 (Serviços + Taxa)
- **Valor Pendente**: R$ 3.538,75 (Hospedagem + Café)

## 📋 Exemplo 2: Natia Ergemlidze (Conforme Documento)

**Dados:**
- Pessoas: 1
- Período: 9/10/2025 → 13/10/2025 (4 noites)
- Aulas de Surf: 4 por pessoa
- Aulas de Yoga: 1 por pessoa

**Cálculos Implementados:**

### Aulas de Surf
- 4 aulas por pessoa → Faixa 4-7 aulas → R$ 160 por aula
- Total: 4 aulas × R$ 160 = **R$ 640,00**

### Yoga
- Período: 9/10 (Quinta) → 13/10 (Segunda)
- Dias grátis disponíveis: 1 (Sexta 10/10)
- Aulas solicitadas: 1 por pessoa
- Aulas cobradas: max(0, 1 - 1) = **0 aulas cobradas**
- Total Yoga: **R$ 0,00**

### Café da Manhã
- 4 dias × R$ 30 = **R$ 120,00**

### Totais
- **Subtotal serviços**: R$ 640,00
- **Hospedagem**: R$ 292,00
- **Café da manhã**: R$ 120,00
- **Total geral**: R$ 1.052,00
- **Valor Retido**: R$ 640,00
- **Valor Pendente**: R$ 412,00

## 🔧 Implementações Técnicas

### Arquivos Modificados:
1. **`src/utils/pricingRules.ts`** - Novas funções de cálculo
2. **`src/utils/priceCalculator.ts`** - Lógica atualizada
3. **`src/types/pricing.ts`** - Tipos atualizados
4. **`src/hooks/usePricingConfig.ts`** - Preços atualizados
5. **`supabase/migrations/001_create_pricing_config.sql`** - Migração atualizada

### Funções Principais:
- `getSurfLessonPrice(quantity)` - Calcula preço baseado na faixa
- `calculateFreeYogaDays(start, end)` - Calcula dias grátis de yoga
- `calculateTransfersForGroup(people)` - Calcula transfers necessários
- `calculateRetainedAndPendingValues(...)` - Calcula valores retido/pendente

## ✅ Status das Regras

| Regra | Status | Implementação |
|-------|--------|---------------|
| Noites = fim − início | ✅ | `differenceInDays()` |
| Café da manhã = Preço × Noites × Pessoas | ✅ | Implementado |
| Faixas de preço Surf (1-3, 4-7, 8+) | ✅ | `getSurfLessonPrice()` |
| Yoga grátis (Quarta/Sexta) | ✅ | `calculateFreeYogaDays()` |
| Transfer > 3 pessoas = 2 transfers | ✅ | `calculateTransfersForGroup()` |
| Extras × pessoa | ✅ | Implementado |
| Aluguel prancha × Noites × Pessoas | ✅ | Implementado |
| Valor Retido = Serviços + Taxa | ✅ | `calculateRetainedAndPendingValues()` |
| Valor Pendente = Hospedagem + Café | ✅ | `calculateRetainedAndPendingValues()` |

## 🎯 Resultado

Todas as regras documentadas foram implementadas com sucesso! O sistema agora calcula preços conforme as especificações fornecidas.
