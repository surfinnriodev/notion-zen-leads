import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { LeadCard } from "./LeadCard";

type Lead = Tables<"reservas">;

const columns = [
  { id: "novo", title: "Novos", status: "novo" },
  { id: "contato", title: "Em Contato", status: "contato" },
  { id: "proposta", title: "Proposta Enviada", status: "proposta" },
  { id: "confirmado", title: "Confirmado", status: "confirmado" },
  { id: "cancelado", title: "Cancelado", status: "cancelado" },
];

export const LeadsBoard = () => {
  const { data: leads, isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservas")
        .select("*")
        .order("property_criado_em", { ascending: false });
      
      if (error) throw error;
      return data as Lead[];
    },
  });

  const getLeadsByStatus = (status: string) => {
    if (!leads) return [];
    return leads.filter((lead) => 
      lead.property_status?.toLowerCase() === status.toLowerCase() || 
      (!lead.property_status && status === "novo")
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-5 gap-6">
          {columns.map((column) => (
            <div key={column.id} className="space-y-4">
              <div className="h-6 bg-muted animate-pulse rounded" />
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-5 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground">{column.title}</h3>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                {getLeadsByStatus(column.status).length}
              </span>
            </div>
            
            <div className="space-y-3">
              {getLeadsByStatus(column.status).map((lead) => (
                <LeadCard key={lead.id} lead={lead} />
              ))}
            </div>
            
            {getLeadsByStatus(column.status).length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nenhum lead
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};