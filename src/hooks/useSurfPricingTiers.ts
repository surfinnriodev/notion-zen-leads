import { useState, createContext, useContext, ReactNode } from 'react';

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
  resetTiers: () => void;
}

const SurfPricingContext = createContext<SurfPricingContextType | undefined>(undefined);

// Valores padrão
const DEFAULT_TIERS: SurfPricingTiers = {
  tier1to3: 180,
  tier4to7: 160,
  tier8plus: 140
};

// Provider component
export function SurfPricingProvider({ children }: { children: ReactNode }) {
  const [tiers, setTiers] = useState<SurfPricingTiers>(DEFAULT_TIERS);

  const updateTiers = (newTiers: SurfPricingTiers) => {
    setTiers(newTiers);
  };

  const resetTiers = () => {
    setTiers(DEFAULT_TIERS);
  };

  return (
    <SurfPricingContext.Provider value={{ tiers, updateTiers, resetTiers }}>
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
