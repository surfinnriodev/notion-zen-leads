import { useState } from "react";
import { Button } from "@/components/ui/button";
import { List, LayoutGrid } from "lucide-react";
import { LeadsList } from "@/components/leads/LeadsList";
import { LeadsBoard } from "@/components/leads/LeadsBoard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePricingConfig } from "@/hooks/usePricingConfig";
import { calculateLeadPrice } from "@/types/leads";

export type ViewMode = "list" | "board";

const Leads = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const { config } = usePricingConfig();

  // Query para buscar leads e contar
  const { data: leads } = useQuery({
    queryKey: ["leads", config],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map(lead => calculateLeadPrice(lead, config));
    },
  });

  const leadCount = leads?.length || 0;

  return (
    <div className="p-6">
      {/* Header com título e controles */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-semibold text-foreground">Leads</h1>
          {/* View Toggle */}
          <div className="flex gap-1">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 w-8 p-0"
              title="Vista de Lista"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "board" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("board")}
              className="h-8 w-8 p-0"
              title="Vista Kanban"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {leadCount} {leadCount === 1 ? 'lead encontrado' : 'leads encontrados'}
        </p>
      </div>

      {/* Content */}
      <div className="bg-card rounded-lg border border-border">
        {viewMode === "list" ? <LeadsList /> : <LeadsBoard />}
      </div>
    </div>
  );
};

export default Leads;