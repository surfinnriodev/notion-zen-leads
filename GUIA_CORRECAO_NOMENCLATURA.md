# 🔧 Guia de Correção de Nomenclatura de Quartos

## 📊 Problemas Encontrados nos Leads

Analisando os **370 leads**, encontrei **9 tipos de problemas** de nomenclatura:

---

## 🔄 Correções que Serão Aplicadas

### 1. ❌ **Shared: Economía mixta** → ✅ **Shared: Mixed Economic**
**Afetados:** Cristian Patricio Cruz Contreras

**Problema:** Nome em espanhol  
**Solução:** Traduzir para inglês padrão

---

### 2. ❌ **undefined: Private** → ✅ **Without room**
**Afetados:** Justine

**Problema:** Valor indefinido/inválido  
**Solução:** Marcar como "sem quarto"

---

### 3. ❌ **Without Room: [espaço vazio]** → ✅ **Without room**
**Afetados:** Albert Chifolelle, Michael Anderson, Anton van Bergten, Paulo Flowcode

**Problema:** Formatação inconsistente com espaço  
**Solução:** Padronizar para formato limpo

---

### 4. ❌ **Shared: Female with A/C** → ✅ **Shared: Female Standard**
**Afetados:** Bianca Borzatti

**Problema:** Tipo não existe no sistema  
**Solução:** Mapear para Female Standard (que tem A/C)

---

### 5. ❌ **Suítes (pré reservado) - Pontal** → ✅ **Private: Sea-View**
**Afetados:** Guido Weiffenbach

**Problema:** Nome de suite específica  
**Solução:** Categorizar como quarto privado com vista

---

### 6. ❌ **Private: A/C + Private bathroom** → ✅ **Private: Double**
**Afetados:** Courtney Laing

**Problema:** Descrição de amenidades ao invés de tipo  
**Solução:** Mapear para Private Double padrão

---

### 7. ❌ **Shared: Standard (A/C)** → ✅ **Shared: Mixed Standard**
**Afetados:** Krisse

**Problema:** Falta especificar Mixed ou Female  
**Solução:** Assumir Mixed por padrão

---

### 8. ❌ **Shared: Economic** → ✅ **Shared: Mixed Economic**
**Afetados:** Natia Ergemlidze

**Problema:** Falta especificar Mixed ou Female  
**Solução:** Assumir Mixed por padrão

---

### 9. ❌ **Maiúsculas/minúsculas inconsistentes** → ✅ **Padronizado**
**Exemplo:** "Without room:" vs "Without Room:"

**Problema:** Formatação inconsistente  
**Solução:** Padronizar tudo

---

## 📈 Resumo Estatístico

Baseado nos 370 leads do arquivo:

### **Tipos Corretos (não precisam correção):**
- ✅ **Private: Sea-View** - 19 leads
- ✅ **Private: Double** - 19 leads  
- ✅ **Private: Shared bathroom** - 16 leads
- ✅ **Shared: Mixed Economic** - 13 leads
- ✅ **Shared: Female Economic** - 10 leads
- ✅ **Shared: Mixed Standard** - 8 leads
- ✅ **Shared: Female Standard** - 6 leads
- ✅ **Private: Family** - 2 leads
- ✅ **Without Room** - 4 leads (corretos)

### **Tipos Incorretos (precisam correção):**
- ❌ **Without Room: [espaço]** - 4 leads
- ❌ **Shared: Economía mixta** - 1 lead
- ❌ **undefined: Private** - 1 lead
- ❌ **Shared: Female with A/C** - 1 lead
- ❌ **Suítes (pré reservado)** - 1 lead
- ❌ **Private: A/C + Private bathroom** - 1 lead
- ❌ **Shared: Standard (A/C)** - 1 lead
- ❌ **Shared: Economic** - 1 lead

**Total a corrigir:** ~11 leads

---

## 🚀 Como Executar a Correção

### **Passo 1: Backup** (Opcional mas recomendado)
```sql
-- Criar backup da tabela antes de corrigir
CREATE TABLE reservations_backup AS 
SELECT * FROM reservations;
```

### **Passo 2: Executar Correção**
1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para **SQL Editor**
3. Abra o arquivo: `supabase/migrations/007_fix_room_type_nomenclature.sql`
4. Copie TODO o conteúdo
5. Cole no SQL Editor
6. Clique em **Run** (ou Ctrl+Enter)

### **Passo 3: Verificar Resultado**
A migração mostra automaticamente:
- Quantos registros foram corrigidos
- Lista de todos os tipos de quarto após correção
- Quantidade de cada tipo

---

## ✅ O Que a Migração Faz

Para cada lead corrigido, atualiza **3 campos:**

1. **`tipo_de_quarto`** - Formato completo (ex: "Private: Double")
2. **`room_category`** - Categoria (ex: "Private")
3. **`room_type`** - Tipo específico (ex: "Double")

Isso garante que:
- ✅ Os cálculos de preço funcionem corretamente
- ✅ Os filtros e buscas encontrem os leads
- ✅ Os relatórios estejam consistentes

---

## 🎯 Tipos Finais Padronizados

Após a correção, todos os leads terão apenas estes tipos:

### **Private Rooms:**
- `Private: Shared bathroom`
- `Private: Double`
- `Private: Sea-View`
- `Private: Triple`
- `Private: Family`

### **Shared Rooms:**
- `Shared: Mixed Economic`
- `Shared: Mixed Standard`
- `Shared: Female Economic`
- `Shared: Female Standard`

### **Sem Quarto:**
- `Without room`

---

## 🔍 Validação Pós-Correção

Execute este query para verificar se ainda há problemas:

```sql
-- Buscar tipos de quarto que não são padrão
SELECT DISTINCT tipo_de_quarto, COUNT(*) as quantidade
FROM reservations
WHERE tipo_de_quarto NOT IN (
  'Private: Shared bathroom',
  'Private: Double',
  'Private: Sea-View',
  'Private: Triple',
  'Private: Family',
  'Shared: Mixed Economic',
  'Shared: Mixed Standard',
  'Shared: Female Economic',
  'Shared: Female Standard',
  'Without room'
)
AND tipo_de_quarto IS NOT NULL
GROUP BY tipo_de_quarto;
```

Se retornar **0 linhas** = Tudo corrigido! ✅

---

## ⚠️ Importante

- A migração é **idempotente** (pode executar várias vezes sem problema)
- Não afeta leads que já estão corretos
- Cria relatório automático das mudanças
- Não apaga dados, apenas corrige nomenclatura

---

## 📞 Suporte

Se encontrar algum tipo de quarto que não foi corrigido:
1. Copie o nome exato do tipo
2. Execute:
```sql
SELECT name, tipo_de_quarto, room_category, room_type
FROM reservations
WHERE tipo_de_quarto = 'COLE_AQUI';
```
3. Me envie o resultado para adicionar na migração

