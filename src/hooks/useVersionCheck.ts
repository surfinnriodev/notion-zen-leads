import { useEffect } from 'react';

const VERSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos
const CURRENT_VERSION = import.meta.env.VITE_APP_VERSION || '1.0';

export const useVersionCheck = () => {
  useEffect(() => {
    const checkVersion = async () => {
      try {
        // Adiciona timestamp para evitar cache
        const response = await fetch(`/version.json?t=${Date.now()}`, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          const serverVersion = data.version;
          
          // Se a versão do servidor for diferente, recarregar
          if (serverVersion !== CURRENT_VERSION) {
            console.log(`🔄 Nova versão detectada: ${serverVersion} (atual: ${CURRENT_VERSION})`);
            
            // Limpar todos os caches do navegador
            if ('caches' in window) {
              caches.keys().then((names) => {
                names.forEach((name) => {
                  caches.delete(name);
                });
              });
            }
            
            // Limpar localStorage de versão antiga
            localStorage.setItem('app_version', serverVersion);
            
            // Recarregar a página (hard reload)
            window.location.reload();
          }
        }
      } catch (error) {
        console.error('Erro ao verificar versão:', error);
      }
    };

    // Verificar imediatamente ao carregar
    checkVersion();

    // Verificar periodicamente
    const interval = setInterval(checkVersion, VERSION_CHECK_INTERVAL);

    // Verificar quando a aba volta a ficar ativa (importante para iPhone)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
};
