# ⚡ Guia Rápido: Implementar Melhorias de Hospedagem e Preços

## 🎯 O que você precisa fazer

Execute apenas **UMA migração SQL** no seu banco de dados Supabase.

---

## 📝 Passo a Passo

### 1️⃣ Acesse o Supabase Dashboard
```
https://supabase.com/dashboard
```

### 2️⃣ Vá para SQL Editor
- No menu lateral, clique em **"SQL Editor"**
- Ou use o atalho: `Ctrl/Cmd + K` e digite "SQL"

### 3️⃣ Execute a Migração
1. Abra o arquivo: `supabase/migrations/005_add_room_fields_and_pricing_overrides.sql`
2. Copie TODO o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **"Run"** (ou pressione `Ctrl/Cmd + Enter`)

### 4️⃣ Aguarde a Confirmação
Você deve ver:
```
Success. No rows returned
```

### 5️⃣ Pronto! 🎉
As melhorias já estão disponíveis no sistema.

---

## ✅ Como Testar

1. **Abra qualquer lead**
2. **Vá para a aba "Hospedagem"**
   - Você deve ver os dois novos dropdowns:
     - Room category
     - Room type (aparece após selecionar a categoria)

3. **Vá para a aba "Preços"**
   - Você deve ver:
     - Campo para ajustar o valor da hospedagem
     - Seção para adicionar taxa extra

---

## 🐛 Se algo der errado

### Erro: "permission denied"
**Solução:** Use uma conta com permissões de administrador

### Erro: "column already exists"
**Solução:** A migração já foi executada antes, está tudo OK!

### Campos não aparecem
**Solução:** 
1. Limpe o cache do navegador (`Ctrl/Cmd + Shift + R`)
2. Faça logout e login novamente

---

## 📊 O que foi adicionado

### No Banco de Dados:
```
✅ room_category
✅ room_type
✅ accommodation_price_override
✅ extra_fee_amount
✅ extra_fee_description
```

### Na Interface:
```
✅ Selects cascateados de hospedagem
✅ Campo de ajuste de preço da hospedagem
✅ Seção de taxa extra com descrição
✅ Cálculo automático do total ajustado
```

---

## 💡 Dicas

1. **Dados existentes:** Serão convertidos automaticamente
2. **Compatibilidade:** O campo antigo `tipo_de_quarto` ainda funciona
3. **Reversível:** Se necessário, os valores ajustados podem ser removidos

---

## 📞 Precisa de Ajuda?

Veja a documentação completa em:
- `CHANGELOG_HOSPEDAGEM_PRECOS.md` - Detalhes das mudanças
- `MIGRATIONS.md` - Guia completo de migrações

---

**Tempo estimado:** ⏱️ 2 minutos

