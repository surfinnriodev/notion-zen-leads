# 🔧 Correção: Tipos de Quarto Faltando

## 🎯 Problema
Alguns tipos de quarto não aparecem calculados na aba de preços (ex: "Private: Shared bathroom").

## ✅ Solução

### **Opção 1: Executar Migração SQL (Recomendado)**

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para **SQL Editor**
3. Execute o arquivo: `supabase/migrations/006_update_room_categories_complete.sql`
4. Aguarde a confirmação "Success"
5. **Recarregue a página** do sistema (F5)

### **Opção 2: Adicionar Manualmente via Interface**

1. Vá para **Calculadora → Configurações**
2. Na seção "Tipos de Acomodação"
3. Clique nos botões:
   - **+ Private Room** (adicione todos os tipos)
   - **+ Shared Room** (adicione todos os tipos)

4. Configure cada tipo:

#### **Private Rooms:**
```
✓ Shared bathroom - R$ 140/noite - Por quarto
✓ Double          - R$ 150/noite - Por quarto
✓ Sea-View        - R$ 200/noite - Por quarto
✓ Triple          - R$ 180/noite - Por quarto
✓ Family          - R$ 220/noite - Por quarto
```

#### **Shared Rooms:**
```
✓ Mixed Economic   - R$ 70/noite - Por pessoa
✓ Mixed Standard   - R$ 80/noite - Por pessoa
✓ Female Economic  - R$ 75/noite - Por pessoa
✓ Female Standard  - R$ 85/noite - Por pessoa
```

5. **Clique em "Salvar Alterações"** (botão que aparece quando você edita)

---

## 📋 Tipos que DEVEM estar cadastrados:

### 🏠 Private Rooms (5 tipos):
| Tipo | Preço Sugerido | Cobrança |
|------|----------------|----------|
| Shared bathroom | R$ 140/noite | Por quarto |
| Double | R$ 150/noite | Por quarto |
| Sea-View | R$ 200/noite | Por quarto |
| Triple | R$ 180/noite | Por quarto |
| Family | R$ 220/noite | Por quarto |

### 🛏️ Shared Rooms (4 tipos):
| Tipo | Preço Sugerido | Cobrança |
|------|----------------|----------|
| Mixed Economic | R$ 70/noite | Por pessoa |
| Mixed Standard | R$ 80/noite | Por pessoa |
| Female Economic | R$ 75/noite | Por pessoa |
| Female Standard | R$ 85/noite | Por pessoa |

---

## ✨ Após Configurar:

1. **Teste um lead**
2. Selecione: Room category = Private
3. Selecione: Room type = Shared bathroom
4. Vá para aba **Preços**
5. **Deve aparecer** o valor da hospedagem calculado

---

## 🔍 Como Verificar se está OK:

Abra o **Console do Navegador** (F12) e procure por:

```
✅ Accommodation calculated: 420
```

Se aparecer:
```
❌ No room category found for: Private: Shared bathroom
```

Significa que o tipo ainda não foi cadastrado na configuração.

---

## 💡 Dica:

Os preços sugeridos são baseados em:
- **Private:** Cobrança por quarto (preço fixo)
- **Shared:** Cobrança por pessoa (multiplica pelo número de pessoas)

Você pode ajustar os valores conforme necessário na configuração!

---

## 📞 Precisa de Ajuda?

Se ainda não funcionar:
1. Abra o Console (F12)
2. Vá na aba "Leads"
3. Selecione um tipo de quarto
4. Copie os logs que aparecem
5. Me envie para diagnóstico

