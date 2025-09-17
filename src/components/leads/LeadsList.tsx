import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { LeadWithCalculation, calculateLeadPrice } from "@/types/leads";
import { usePricingConfig } from "@/hooks/usePricingConfig";
import { LeadListItem } from "./LeadListItem";

type Lead = Tables<"notion_reservas">;

export const LeadsList = () => {
  const { config } = usePricingConfig();

  const { data: leads, isLoading } = useQuery({
    queryKey: ["leads", config],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notion_reservas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const leadsWithCalculation: LeadWithCalculation[] = data.map(lead =>
        calculateLeadPrice(lead, config)
      );

      return leadsWithCalculation;
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-4">
        {leads?.map((lead) => (
          <LeadListItem key={lead.id} lead={lead} />
        )) || (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum lead encontrado
          </div>
        )}
      </div>
    </div>
  );
};