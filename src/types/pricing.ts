export interface RoomCategory {
  id: string;
  name: string; // ex: "Private: Double", "Shared: Mixed Standard"
  pricePerNight: number;
  billingType: 'per_room' | 'per_person'; // como cobra: por quarto ou por pessoa
}

export interface PackageConfig {
  id: string;
  name: string;
  fixedPrice: number;
  overridesIndividualPricing: boolean; // se true, substitui preços individuais; se false, soma com preços individuais
  includedItems: {
    breakfast?: boolean;
    unlimitedBoardRental?: boolean;
    surfLessons?: number;
    yogaLessons?: number;
    surfSkate?: number;
    videoAnalysis?: number;
    massage?: number;
    surfGuide?: number;
    transfer?: number;
  };
}

// Item dinâmico de cobrança
export interface PricingItem {
  id: string;
  name: string;
  price: number;
  billingType: 'per_unit' | 'per_person' | 'per_room' | 'per_reservation' | 'per_day' | 'per_night' | 'boolean';
  category: 'daily' | 'fixed' | 'boolean';
  dbColumn?: string; // coluna correspondente no banco
}

export interface SurfLessonPricing {
  tier1: number; // 1-3 aulas
  tier2: number; // 4-7 aulas
  tier3: number; // 8+ aulas
}

export interface PricingConfig {
  roomCategories: RoomCategory[];
  packages: PackageConfig[];
  items: PricingItem[]; // todos os itens de cobrança
  surfLessonPricing?: SurfLessonPricing; // faixas de preço para aulas de surf
}

export interface CalculationInput {
  checkInStart: string;
  checkInEnd: string;
  numberOfPeople: number;
  roomCategory: string;
  packageId?: string;
  
  // Extras solicitados
  breakfast?: number; // dias extras além do pacote
  unlimitedBoardRental?: number; // dias extras
  surfLessons?: number;
  yogaLessons?: number;
  surfSkate?: number;
  videoAnalysis?: number;
  massage?: number;
  surfGuide?: number;
  transfer?: number;
  hike?: number;
  rioCityTour?: number;
  cariocaExperience?: number;
}

export interface CalculationResult {
  numberOfNights: number;
  numberOfPeople: number;
  
  packageCost: number;
  accommodationCost: number;
  dailyItemsCost: number;
  fixedItemsCost: number;
  
  breakdown: {
    package?: { name: string; cost: number };
    accommodation?: { description: string; cost: number };
    dailyItems: Array<{ name: string; quantity: number; unitPrice: number; cost: number }>;
    fixedItems: Array<{ name: string; quantity: number; unitPrice: number; cost: number }>;
  };
  
  totalCost: number;
  // Novos campos para valor retido e pendente
  retainedValue?: number;
  pendingValue?: number;
  servicesCost?: number;
  feeCost?: number;
}