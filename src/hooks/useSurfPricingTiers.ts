import { useState, createContext, useContext, ReactNode, useEffect } from 'react';

// Interface para as faixas de preço
export interface SurfPricingTiers {
  tier1to3: number;  // 1-3 aulas
  tier4to7: number;  // 4-7 aulas
  tier8plus: number; // 8+ aulas
}

// Context para gerenciar as faixas de preço
interface SurfPricingContextType {
  tiers: SurfPricingTiers;
  updateTiers: (newTiers: SurfPricingTiers) => void;
  updateSingleTier: (key: keyof SurfPricingTiers, value: number) => void;
  saveTiers: () => void;
  resetTiers: () => void;
  hasUnsavedChanges: boolean;
  isLoading: boolean;
}

const SurfPricingContext = createContext<SurfPricingContextType | undefined>(undefined);

// Valores padrão
const DEFAULT_TIERS: SurfPricingTiers = {
  tier1to3: 180,
  tier4to7: 160,
  tier8plus: 140
};

const STORAGE_KEY = 'surf-pricing-tiers';

// Provider component
export function SurfPricingProvider({ children }: { children: ReactNode }) {
  const [tiers, setTiers] = useState<SurfPricingTiers>(DEFAULT_TIERS);
  const [savedTiers, setSavedTiers] = useState<SurfPricingTiers>(DEFAULT_TIERS);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar tiers salvos do localStorage na inicialização
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedTiers = JSON.parse(saved);
        setTiers(parsedTiers);
        setSavedTiers(parsedTiers);
      }
    } catch (error) {
      console.error('Erro ao carregar tiers salvos:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateTiers = (newTiers: SurfPricingTiers) => {
    setTiers(newTiers);
  };

  const updateSingleTier = (key: keyof SurfPricingTiers, value: number) => {
    setTiers(prev => ({
      ...prev,
      [key]: Math.max(0, value) // Garantir que não seja negativo
    }));
  };

  const saveTiers = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tiers));
      setSavedTiers(tiers);
    } catch (error) {
      console.error('Erro ao salvar tiers:', error);
    }
  };

  const resetTiers = () => {
    setTiers(DEFAULT_TIERS);
    setSavedTiers(DEFAULT_TIERS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Erro ao resetar tiers:', error);
    }
  };

  const hasUnsavedChanges = JSON.stringify(tiers) !== JSON.stringify(savedTiers);

  return (
    <SurfPricingContext.Provider value={{ 
      tiers, 
      updateTiers, 
      updateSingleTier,
      saveTiers,
      resetTiers,
      hasUnsavedChanges,
      isLoading
    }}>
      {children}
    </SurfPricingContext.Provider>
  );
}

// Hook para usar o contexto
export function useSurfPricingTiers() {
  const context = useContext(SurfPricingContext);
  if (context === undefined) {
    throw new Error('useSurfPricingTiers must be used within a SurfPricingProvider');
  }
  return context;
}
