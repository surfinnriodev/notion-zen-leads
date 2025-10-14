/**
 * Copia texto para a área de transferência com fallback para Safari/iOS
 * @param text Texto a ser copiado
 * @returns Promise que resolve quando o texto for copiado com sucesso
 */
export async function copyToClipboard(text: string): Promise<void> {
  // Tentar usar a API moderna primeiro
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
 * Funciona em Safari e navegadores mais antigos
 */
function copyToClipboardFallback(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const textarea = document.createElement('textarea');
    
    // Configurar textarea para ser invisível mas funcional
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    textarea.setAttribute('readonly', '');
    
    document.body.appendChild(textarea);
    
    // Selecionar o texto
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    
    try {
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
      // Remover textarea temporário
      document.body.removeChild(textarea);
    }
  });
}

