export interface RoomCategory {
  id: string;
  name: string; // ex: "Private: Double", "Shared: Mixed Standard"
  pricePerNight: number;
  perPerson: boolean; // se cobra por pessoa ou por quarto
}

export interface PackageConfig {
  id: string;
  name: string;
  fixedPrice: number;
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

export interface PricingConfig {
  roomCategories: RoomCategory[];
  packages: PackageConfig[];
  
  // Itens que multiplicam por dias e pessoas
  dailyItems: {
    breakfast: { price: number; perPerson: boolean };
    unlimitedBoardRental: { price: number; perPerson: boolean };
  };
  
  // Itens com valor fixo por unidade
  fixedItems: {
    surfLessons: {
      tier1_3: { price: number; perPerson: boolean }; // 1-3 aulas
      tier4_7: { price: number; perPerson: boolean }; // 4-7 aulas  
      tier8plus: { price: number; perPerson: boolean }; // 8+ aulas
    };
    yogaLessons: { price: number; perPerson: boolean };
    surfSkate: { price: number; perPerson: boolean };
    videoAnalysis: { price: number; perPerson: boolean };
    massage: { price: number; perPerson: boolean };
    surfGuide: { price: number; perPerson: boolean };
    transfer: { price: number; perReservation: boolean }; // por trecho/viagem
    activities: {
      hike: { price: number; perPerson: boolean };
      rioCityTour: { price: number; perPerson: boolean };
      cariocaExperience: { price: number; perPerson: boolean };
    };
  };
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
}