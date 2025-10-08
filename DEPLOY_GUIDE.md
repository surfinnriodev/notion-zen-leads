# 📱 Guia de Deploy - Solução de Cache para iOS/iPhone

## 🎯 Problema Resolvido

O iPhone/Safari tem cache muito agressivo que impedia usuários de verem atualizações após deploys.

## ✅ Soluções Implementadas

### 1. **Meta Tags de Cache Control** (`index.html`)
```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
```

### 2. **Cache Busting Automático** (`vite.config.ts`)
- Arquivos JS/CSS ganham hash único a cada build
- Exemplo: `main.abc123.js` → `main.xyz789.js`

### 3. **Sistema de Detecção de Versão**
- Verifica automaticamente se há nova versão
- Força reload quando detecta atualização
- Funciona especialmente bem no iOS

## 🚀 Como Fazer Deploy

### Passo 1: Atualizar Versão
Antes de fazer deploy, atualize o arquivo `public/version.json`:

```json
{
  "version": "1.0.1",
  "timestamp": "2025-01-08T12:00:00Z"
}
```

**Importante:** Sempre incremente a versão!

### Passo 2: Build e Deploy
```bash
npm run build
# ou
bun run build

# Depois faça o deploy normalmente
```

### Passo 3: Testar no iPhone
1. Abra o app no iPhone
2. O sistema detectará automaticamente a nova versão
3. A página recarregará automaticamente em até 5 minutos
4. OU quando o usuário mudar de aba e voltar

## 🔄 Como Funciona

### Verificação Automática:
- ✅ A cada **5 minutos** enquanto o app está aberto
- ✅ Quando o usuário **volta para a aba** do app
- ✅ Quando o app é **aberto novamente**

### Quando Nova Versão é Detectada:
1. Limpa **todos os caches** do navegador
2. Atualiza versão no localStorage
3. Força **hard reload** da página

## 📱 Instruções para Usuários iPhone

Se mesmo assim aparecer versão antiga:

### Opção 1: Forçar Atualização (Recomendado)
1. Feche completamente o Safari (deslize para cima)
2. Abra novamente
3. Aguarde 5 segundos
4. A página recarregará automaticamente

### Opção 2: Limpar Cache Manual
1. Configurações → Safari
2. Limpar Histórico e Dados
3. Abrir o app novamente

### Opção 3: Modo Privado
1. Abrir Safari
2. Trocar para navegação privada
3. Acessar o app

## 📋 Checklist de Deploy

- [ ] Atualizar `public/version.json` com nova versão
- [ ] Fazer build: `npm run build`
- [ ] Fazer deploy
- [ ] Testar em desktop
- [ ] Testar no iPhone (esperar 5 min ou fechar e abrir)
- [ ] Confirmar que atualização foi aplicada

## 🐛 Troubleshooting

### Ainda aparece versão antiga no iPhone?

**1. Verificar se o deploy funcionou:**
- Abra: `https://seu-dominio.com/version.json?t=123`
- Deve mostrar a nova versão

**2. Verificar Console do iPhone:**
- Safari → Desenvolver → iPhone → Console
- Procurar por: "🔄 Nova versão detectada"

**3. Última opção - Adicionar parâmetro:**
- Compartilhe: `https://seu-dominio.com/?v=1.0.1`
- Força bypass de cache

## 💡 Dicas

- **Sempre incremente a versão** no `version.json`
- **Notifique usuários** sobre atualizações importantes
- **Versões sugeridas:**
  - Bug fixes: 1.0.1 → 1.0.2
  - Novas features: 1.0.0 → 1.1.0
  - Grandes mudanças: 1.0.0 → 2.0.0

## 🔧 Configurações Avançadas

### Mudar Intervalo de Verificação
Edite `src/hooks/useVersionCheck.ts`:
```typescript
const VERSION_CHECK_INTERVAL = 2 * 60 * 1000; // 2 minutos
```

### Desabilitar Verificação Automática
Remova ou comente no `src/App.tsx`:
```typescript
// useVersionCheck(); // Desabilitado
```

## ✅ Benefícios

- 🚀 **Usuários sempre com última versão**
- 📱 **Funciona perfeitamente no iPhone/iOS**
- 🔄 **Atualização automática transparente**
- 💾 **Sem necessidade de limpar cache manual**
- ⚡ **Deploy sem preocupações**
