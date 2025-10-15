import { useState, useEffect } from "react";

export function useIsMobileOrSafari() {
  const [isMobileOrSafari, setIsMobileOrSafari] = useState<boolean>(false);

  useEffect(() => {
    const checkMobileOrSafari = () => {
      // Verifica se é mobile baseado na largura da tela
      const isMobile = window.innerWidth < 768;
      
      // Verifica se é Safari
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      
      // Verifica se é iOS (iPhone/iPad)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      // Retorna true se for mobile OU Safari OU iOS
      return isMobile || isSafari || isIOS;
    };

    setIsMobileOrSafari(checkMobileOrSafari());

    // Listener para mudanças de tamanho da tela
    const handleResize = () => {
      setIsMobileOrSafari(checkMobileOrSafari());
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return isMobileOrSafari;
}

// Função utilitária para selecionar todo o texto de um elemento
export function selectAllText(elementId: string): void {
  const element = document.getElementById(elementId) as HTMLTextAreaElement;
  if (element) {
    element.focus();
    element.select();
  }
}
