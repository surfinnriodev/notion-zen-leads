import { Tables } from "@/integrations/supabase/types";

// Tipos para as novas tabelas
export type PricingConfig = Tables<"pricing_config">;
export type MessageTemplate = Tables<"message_templates">;
export type MessageHistory = Tables<"message_history">;

// Tipos para inserção
export type PricingConfigInsert = Omit<PricingConfig, "id" | "created_at" | "updated_at">;
export type MessageTemplateInsert = Omit<MessageTemplate, "id" | "created_at" | "updated_at">;
export type MessageHistoryInsert = Omit<MessageHistory, "id" | "created_at">;

// Tipos para atualização
export type PricingConfigUpdate = Partial<Omit<PricingConfig, "id" | "created_at" | "updated_at">>;
export type MessageTemplateUpdate = Partial<Omit<MessageTemplate, "id" | "created_at" | "updated_at">>;
export type MessageHistoryUpdate = Partial<Omit<MessageHistory, "id" | "created_at">>;

// Tipos para configuração de preços com tipagem forte
export interface PricingConfigData {
  roomCategories: Array<{
    id: string;
    name: string;
    pricePerNight: number;
    billingType: 'per_room' | 'per_person';
  }>;
  packages: Array<{
    id: string;
    name: string;
    fixedPrice: number;
    overridesIndividualPricing: boolean;
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
  }>;
  items: Array<{
    id: string;
    name: string;
    price: number;
    billingType: 'per_unit' | 'per_person' | 'per_room' | 'per_reservation' | 'per_day' | 'per_night' | 'boolean';
    category: 'daily' | 'fixed' | 'boolean';
    dbColumn?: string;
  }>;
}

// Tipo para mensagem com histórico
export interface MessageWithHistory extends MessageTemplate {
  history?: MessageHistory[];
}

// Tipo para estatísticas de mensagens
export interface MessageStats {
  totalSent: number;
  byTemplate: Record<string, number>;
  byType: Record<string, number>;
  recentMessages: MessageHistory[];
}
