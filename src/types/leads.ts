import { Tables } from "@/integrations/supabase/types";
import { CalculationInput, CalculationResult } from "./pricing";
import { calculatePrice } from "@/utils/priceCalculator";

export type NotionReserva = Tables<"notion_reservas">;

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

export function convertLeadToCalculationInput(lead: NotionReserva): CalculationInput {
  return {
    checkInStart: lead.check_in_start || "",
    checkInEnd: lead.check_in_end || "",
    numberOfPeople: lead.number_of_people || 1,
    roomCategory: mapRoomType(lead.tipo_de_quarto),
    packageId: lead.pacote || undefined,

    // Itens diários (baseados em arrays de dias)
    breakfast: lead.include_breakfast?.length || 0,
    unlimitedBoardRental: lead.aluguel_prancha_ilimitado?.length || 0,

    // Atividades com quantidade numérica
    surfLessons: lead.aulas_de_surf || 0,
    yogaLessons: lead.aulas_de_yoga || 0,
    surfSkate: lead.skate || 0,
    videoAnalysis: (lead.analise_de_video_extra || 0) + (lead.analise_de_video_package || 0),
    massage: (lead.massagem_extra || 0) + (lead.massagem_package || 0),
    surfGuide: lead.surf_guide_package || 0,
    transfer: (lead.transfer_extra || 0) + (lead.transfer_package || 0),

    // Experiências (baseadas em quantidade numérica)
    hike: lead.hike_extra || 0,
    rioCityTour: lead.rio_city_tour_extra || 0,
    cariocaExperience: lead.carioca_experience_extra || 0,
  };
}


export function calculateLeadPrice(lead: NotionReserva, config: any): LeadWithCalculation {
  try {
    const input = convertLeadToCalculationInput(lead);

    console.log("💰 Calculando preço para lead:", lead.name);
    console.log("📊 Input de cálculo:", input);
    console.log("🎯 Atividades extraídas:", {
      surfLessons: input.surfLessons,
      yogaLessons: input.yogaLessons,
      surfSkate: input.surfSkate,
      videoAnalysis: input.videoAnalysis,
      massage: input.massage,
      hike: input.hike,
      rioCityTour: input.rioCityTour,
      cariocaExperience: input.cariocaExperience
    });
    console.log("🏨 Config:", config);

    // Sempre tentar calcular, mesmo com dados parciais
    if (!input.checkInStart || !input.checkInEnd) {
      console.log("⚠️ Sem datas definidas, calculando apenas extras");
      // Calcular apenas extras sem hospedagem
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

    console.log("✅ Preço calculado:", calculatedPrice);

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