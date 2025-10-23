import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateLeadPrice } from "@/types/leads";
import { usePricingConfig } from "./usePricingConfig";

interface DashboardMetrics {
  totalLeads: number;
  totalRevenue: number;
  projectedRevenue: number;
  averageRevenuePerLead: number;
  leadsByStatus: Record<string, {
    count: number;
    revenue: number;
    percentage: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    leads: number;
  }>;
  topPackages: Array<{
    package: string;
    count: number;
    revenue: number;
  }>;
  conversionFunnel: Array<{
    status: string;
    count: number;
    conversionRate?: number;
  }>;
  averageStayLength: number;
  roomTypeDistribution: Record<string, number>;
}

export const useDashboardData = () => {
  const { config } = usePricingConfig();

  return useQuery({
    queryKey: ["dashboard-metrics", config],
    queryFn: async (): Promise<DashboardMetrics> => {
      console.log("🔍 Buscando dados para dashboard...");

      // Buscar todos os leads da tabela reservations
      const { data: leads, error } = await supabase
        .from("reservations")
        .select("*")
        .order('created_at', { ascending: false });

      if (error) {
        console.error("❌ Erro ao buscar leads:", error);
        throw error;
      }

      if (!leads || leads.length === 0) {
        console.log("⚠️ Nenhum lead encontrado na tabela reservations");
        return getEmptyMetrics();
      }

      console.log(`✅ ${leads.length} leads encontrados na tabela 'reservations'`);

      console.log(`📊 Processando ${leads.length} leads para métricas`);

      // Debug: mostrar alguns exemplos de status
      const statusSample = leads.slice(0, 5).map(lead => ({
        id: lead.id,
        status: lead.status,
        nome: (lead as any).nome || lead.name
      }));
      console.log("🔍 Amostra de status dos leads:", statusSample);

      // Calcular preços para todos os leads
      const leadsWithPricing = leads.map(lead => ({
        ...lead,
        ...calculateLeadPrice(lead, config)
      }));

      // Status que indicam receita confirmada (pago)
      const paidStatuses = [
        'pago | a se hospedar',
        'pago',
        'hospedagem concluída',
        'hospedagem concluida',
        'concluído',
        'concluido'
      ];

      // Status a serem excluídos (perdidos, cancelados)
      const excludedStatuses = [
        'perdido',
        'cancelado',
        'descartado'
      ];

      // Filtrar leads pagos (receita real)
      const paidLeads = leadsWithPricing.filter(lead => {
        const status = (lead.status || '').toLowerCase().trim();
        return paidStatuses.some(paidStatus => status.includes(paidStatus));
      });

      // Filtrar leads válidos para projeção (excluir perdidos/cancelados)
      const validLeads = leadsWithPricing.filter(lead => {
        const status = (lead.status || '').toLowerCase().trim();
        return !excludedStatuses.some(excludedStatus => status.includes(excludedStatus));
      });

      // Métricas básicas
      const totalLeads = leads.length;
      const totalRevenue = paidLeads.reduce((sum, lead) => sum + (lead.totalPrice || 0), 0);
      const projectedRevenue = validLeads.reduce((sum, lead) => sum + (lead.totalPrice || 0), 0);
      const averageRevenuePerLead = totalRevenue / (paidLeads.length || 1);

      // Leads por status
      const leadsByStatus: Record<string, { count: number; revenue: number; percentage: number }> = {};

      leadsWithPricing.forEach(lead => {
        // Mapear status do Supabase para status do sistema
        let status = lead.status || "Novo";

        // Se o status for "Lead" do Supabase, mapear para "Novo"
        if (status === "Lead" || status === "lead" || status === "LEAD") {
          status = "Novo";
        }

        if (!leadsByStatus[status]) {
          leadsByStatus[status] = { count: 0, revenue: 0, percentage: 0 };
        }
        leadsByStatus[status].count++;
        leadsByStatus[status].revenue += lead.totalPrice || 0;
      });

      // Calcular percentuais
      Object.keys(leadsByStatus).forEach(status => {
        leadsByStatus[status].percentage = (leadsByStatus[status].count / totalLeads) * 100;
      });

      // Revenue por mês (últimos 6 meses)
      const revenueByMonth = getRevenueByMonth(leadsWithPricing);

      // Top pacotes
      const packageStats: Record<string, { count: number; revenue: number }> = {};
      leadsWithPricing.forEach(lead => {
        if (lead.pacote) {
          if (!packageStats[lead.pacote]) {
            packageStats[lead.pacote] = { count: 0, revenue: 0 };
          }
          packageStats[lead.pacote].count++;
          packageStats[lead.pacote].revenue += lead.totalPrice || 0;
        }
      });

      const topPackages = Object.entries(packageStats)
        .map(([pkg, stats]) => ({ package: pkg, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Funil de conversão
      const statusOrder = ["Novo", "Lead", "FUP 1", "Orçamento enviado", "Link de Pagamento Enviado", "Pago | A se hospedar", "Hospedagem concluída"];
      const conversionFunnel = statusOrder.map((status, index) => {
        const count = leadsByStatus[status]?.count || 0;
        const conversionRate = index > 0 && leadsByStatus[statusOrder[index - 1]]?.count
          ? (count / leadsByStatus[statusOrder[index - 1]].count) * 100
          : undefined;
        return { status, count, conversionRate };
      }).filter(item => item.count > 0);

      // Duração média de estadia
      const averageStayLength = calculateAverageStayLength(leads);

      // Distribuição por tipo de quarto
      const roomTypeDistribution: Record<string, number> = {};
      leads.forEach(lead => {
        if (lead.tipo_de_quarto) {
          roomTypeDistribution[lead.tipo_de_quarto] = (roomTypeDistribution[lead.tipo_de_quarto] || 0) + 1;
        }
      });

      console.log("✅ Métricas calculadas:", {
        totalLeads,
        paidLeads: paidLeads.length,
        totalRevenue: totalRevenue.toFixed(2),
        projectedRevenue: projectedRevenue.toFixed(2),
        statusCount: Object.keys(leadsByStatus).length
      });

      return {
        totalLeads,
        totalRevenue,
        projectedRevenue,
        averageRevenuePerLead,
        leadsByStatus,
        revenueByMonth,
        topPackages,
        conversionFunnel,
        averageStayLength,
        roomTypeDistribution
      };
    },
    staleTime: 1 * 60 * 1000, // 1 minuto
    refetchInterval: 30 * 1000, // Recarregar a cada 30 segundos
  });
};

function getEmptyMetrics(): DashboardMetrics {
  return {
    totalLeads: 0,
    totalRevenue: 0,
    projectedRevenue: 0,
    averageRevenuePerLead: 0,
    leadsByStatus: {},
    revenueByMonth: [],
    topPackages: [],
    conversionFunnel: [],
    averageStayLength: 0,
    roomTypeDistribution: {}
  };
}

function getRevenueByMonth(leads: any[]): Array<{ month: string; revenue: number; leads: number }> {
  const monthlyData: Record<string, { revenue: number; leads: number }> = {};

  leads.forEach(lead => {
    if (lead.created_at) {
      const date = new Date(lead.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, leads: 0 };
      }

      monthlyData[monthKey].revenue += lead.totalPrice || 0;
      monthlyData[monthKey].leads++;
    }
  });

  return Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6) // Últimos 6 meses
    .map(([month, data]) => ({
      month: new Intl.DateTimeFormat('pt-BR', { year: 'numeric', month: 'short' }).format(new Date(month + '-01')),
      ...data
    }));
}

function calculateAverageStayLength(leads: any[]): number {
  const validStays = leads
    .filter(lead => lead.check_in_start && lead.check_in_end)
    .map(lead => {
      const start = new Date(lead.check_in_start);
      const end = new Date(lead.check_in_end);
      return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    })
    .filter(days => days > 0 && days < 100); // Filtrar valores irreais

  return validStays.length > 0
    ? validStays.reduce((sum, days) => sum + days, 0) / validStays.length
    : 0;
}