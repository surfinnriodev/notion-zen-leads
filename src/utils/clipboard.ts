/**
 * Copia texto para a área de transferência com suporte completo para Safari/iOS
 * @param text Texto a ser copiado
 * @returns Promise que resolve quando o texto for copiado com sucesso
 */
export async function copyToClipboard(text: string): Promise<void> {
  // Detectar se é iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  // No iOS, sempre usar o método fallback que é mais confiável
  if (isIOS) {
    return copyToClipboardFallback(text);
  }
  
  // Em outros navegadores, tentar usar a API moderna primeiro
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (err) {
      console.warn('Clipboard API falhou, usando fallback:', err);
    }
  }
  
  // Fallback para navegadores mais antigos ou Safari
  return copyToClipboardFallback(text);
}

/**
 * Método fallback para copiar texto usando textarea temporário
 * Otimizado especialmente para Safari iOS
 */
function copyToClipboardFallback(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const textarea = document.createElement('textarea');
    
    // Configuração específica para iOS Safari
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.width = '2em';
    textarea.style.height = '2em';
    textarea.style.padding = '0';
    textarea.style.border = 'none';
    textarea.style.outline = 'none';
    textarea.style.boxShadow = 'none';
    textarea.style.background = 'transparent';
    textarea.style.fontSize = '16px'; // Previne zoom no iOS
    textarea.setAttribute('readonly', '');
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    
    document.body.appendChild(textarea);
    
    // Detectar se é iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    try {
      // Focar no textarea
      textarea.focus();
      
      if (isIOS) {
        // Método específico para iOS
        const range = document.createRange();
        range.selectNodeContents(textarea);
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
        textarea.setSelectionRange(0, text.length);
      } else {
        // Método padrão para outros navegadores
        textarea.select();
        textarea.setSelectionRange(0, text.length);
      }
      
      // Executar comando de cópia
      const successful = document.execCommand('copy');
      
      if (successful) {
        resolve();
      } else {
        reject(new Error('Comando de cópia falhou'));
      }
    } catch (err) {
      reject(err);
    } finally {
      // Remover textarea temporário após um pequeno delay
      setTimeout(() => {
        document.body.removeChild(textarea);
      }, 100);
    }
  });
}

