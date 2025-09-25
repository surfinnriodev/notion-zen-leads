import { Tables } from "@/integrations/supabase/types";
import { CalculationInput, CalculationResult } from "./pricing";
import { calculatePrice } from "@/utils/priceCalculator";

export type NotionReserva = Tables<"reservations">;

export interface LeadWithCalculation extends NotionReserva {
  calculatedPrice?: PricingResult;
  totalPrice?: number;
}

// Mapeamento entre valores do Supabase e IDs da configuração
const ROOM_TYPE_MAPPING: Record<string, string> = {
  "Without room": "",
  "Private: Double": "private-double",
  "Private: Single": "private-single",
  "Private: Shared bathroom": "private-double", // Assumindo que é similar ao double
  "Shared: Mixed Standard": "shared-mixed",
  "Shared: Female Only": "shared-female",
  "private-double": "private-double", // Já no formato correto
  "private-single": "private-single",
  "shared-mixed": "shared-mixed",
  "shared-female": "shared-female",
};

function mapRoomType(supabaseRoomType: string | null): string {
  if (!supabaseRoomType) return "";
  return ROOM_TYPE_MAPPING[supabaseRoomType] || "";
}

// Helper function to calculate actual days between dates
function calculateDaysBetween(startDate: string | null, endDate: string | null): number {
  if (!startDate || !endDate) return 0;

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch (e) {
    console.warn("Erro ao calcular dias:", e);
    return 0;
  }
}

export function convertLeadToCalculationInput(lead: NotionReserva): CalculationInput {
  return {
    checkInStart: lead.check_in_start || '',
    checkInEnd: lead.check_in_end || '',
    numberOfPeople: lead.number_of_people || 1,
    roomCategory: mapRoomType(lead.tipo_de_quarto),
    packageId: lead.pacote || undefined,

    // Itens diários
    breakfast: lead.breakfast ? 1 : 0, // Convert boolean to days count - will need to calculate actual days
    unlimitedBoardRental: lead.aluguel_de_prancha ? 1 : 0, // Convert boolean to days count

    // Atividades com quantidade numérica
    surfLessons: lead.aulas_de_surf || 0,
    yogaLessons: lead.aulas_de_yoga || 0,
    surfSkate: lead.skate || 0,
    videoAnalysis: (lead.analise_de_video || 0) + (lead.analise_de_video_package || 0),
    massage: (lead.massagem_extra ? 1 : 0) + (lead.massagem_package || 0),
    surfGuide: (lead.surf_guide || 0) + (lead.surf_guide_package || 0),
    transfer: (lead.transfer_extra ? 1 : 0) + (lead.transfer_package || 0) + (lead.transfer ? 1 : 0),

    // Experiências (convertendo boolean para numeric)
    hike: lead.hike_extra ? 1 : 0,
    rioCityTour: lead.rio_city_tour ? 1 : 0,
    cariocaExperience: lead.carioca_experience ? 1 : 0,
  };
}


export function calculateLeadPrice(lead: NotionReserva, config: any): LeadWithCalculation {
  try {
    const input = convertLeadToCalculationInput(lead);

    // Update daily items to use actual number of days
    if (input.checkInStart && input.checkInEnd) {
      const numDays = calculateDaysBetween(input.checkInStart, input.checkInEnd);
      // Update breakfast and board rental to use actual days if they're enabled
      if (lead.breakfast) {
        input.breakfast = numDays;
      }
      if (lead.aluguel_de_prancha) {
        input.unlimitedBoardRental = numDays;
      }
    }

    // Always try to calculate, even with partial data
    if (!input.checkInStart || !input.checkInEnd) {
      // Calculate only extras without accommodation
      const calculatedPrice = {
        numberOfNights: 0,
        numberOfPeople: input.numberOfPeople,
        packageCost: 0,
        accommodationCost: 0,
        dailyItemsCost: 0,
        fixedItemsCost: 0,
        breakdown: { dailyItems: [], fixedItems: [] },
        totalCost: 0,
      };

      return {
        ...lead,
        calculatedPrice,
        totalPrice: 0
      };
    }

    const calculatedPrice = calculatePrice(input, config);

    return {
      ...lead,
      calculatedPrice,
      totalPrice: calculatedPrice.totalCost
    };
  } catch (error) {
    console.error("❌ Erro ao calcular preço do lead:", error);
    return { ...lead };
  }
}

export function getLeadDisplayPrice(lead: LeadWithCalculation): string {
  if (lead.totalPrice) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(lead.totalPrice);
  }

  return "Orçamento pendente";
}

// Helper function to map the current structure to legacy format (for compatibility with modal)
export function mapReservaToLegacyFormat(lead: NotionReserva): any {
  return {
    ...lead,
    // Basic fields - already in correct format for new structure
    name: lead.name,
    email: lead.email,
    telefone: lead.telefone,
    status: lead.status,
    number_of_people: lead.number_of_people,
    tipo_de_quarto: lead.tipo_de_quarto,
    pacote: lead.pacote,
    obs_do_cliente: lead.obs_do_cliente,
    resumo_dos_servicos: lead.resumo_dos_servicos,
    nivel_de_surf: lead.nivel_de_surf,
    notion_page_id: lead.notion_page_id,

    // Dates are already strings
    check_in_start: lead.check_in_start,
    check_in_end: lead.check_in_end,

    // Activities and extras - direct mapping from reservations table
    aulas_de_surf: lead.aulas_de_surf,
    aulas_de_yoga: lead.aulas_de_yoga,
    skate: lead.skate,
    analise_de_video_extra: lead.analise_de_video,
    analise_de_video_package: lead.analise_de_video_package,
    massagem_extra: lead.massagem_extra,
    massagem_package: lead.massagem_package,
    surf_guide_package: lead.surf_guide_package,
    transfer_extra: lead.transfer_extra,
    transfer_package: lead.transfer_package,

    // Boolean items - mapping database fields to legacy modal field names
    include_breakfast: lead.breakfast,
    aluguel_prancha_ilimitado: lead.aluguel_de_prancha,

    // Experience booleans - mapping database fields to legacy modal field names
    hike_extra: lead.hike_extra,
    rio_city_tour_extra: lead.rio_city_tour,
    carioca_experience_extra: lead.carioca_experience,
  };
}

export function getLeadCalculationStatus(lead: LeadWithCalculation): {
  status: "complete" | "incomplete" | "error";
  message: string;
} {
  if (!lead.check_in_start || !lead.check_in_end) {
    return { status: "incomplete", message: "Datas não informadas" };
  }

  if (!lead.tipo_de_quarto) {
    return { status: "incomplete", message: "Tipo de quarto não informado" };
  }

  if (!lead.number_of_people) {
    return { status: "incomplete", message: "Número de pessoas não informado" };
  }

  if (lead.calculatedPrice) {
    return { status: "complete", message: "Orçamento calculado" };
  }

  return { status: "error", message: "Erro no cálculo" };
}