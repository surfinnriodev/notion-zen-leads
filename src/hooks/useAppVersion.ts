import { useState, useEffect } from 'react';

interface VersionInfo {
  version: string;
  date: string;
  timestamp?: string;
}

export const useAppVersion = () => {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const response = await fetch(`/version.json?t=${Date.now()}`, {
          cache: 'no-cache',
        });
        
        if (response.ok) {
          const data = await response.json();
          setVersionInfo({
            version: data.version || '1.0',
            date: data.date || '14/11',
            timestamp: data.timestamp,
          });
        } else {
          // Fallback se não conseguir carregar
          setVersionInfo({
            version: '1.0',
            date: '14/11',
          });
        }
      } catch (error) {
        console.error('Erro ao carregar versão:', error);
        // Fallback em caso de erro
        setVersionInfo({
          version: '1.0',
          date: '14/11',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchVersion();
  }, []);

  return { versionInfo, isLoading };
};

