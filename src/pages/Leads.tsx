import { useState } from "react";
import { Button } from "@/components/ui/button";
import { List, LayoutGrid, Plus } from "lucide-react";
import { LeadsList } from "@/components/leads/LeadsList";
import { LeadsBoard } from "@/components/leads/LeadsBoard";
import { CompleteLeadModal } from "@/components/leads/CompleteLeadModal";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePricingConfig } from "@/hooks/usePricingConfig";
import { calculateLeadPrice } from "@/types/leads";
import type { LeadWithCalculation } from "@/types/leads";

export type ViewMode = "list" | "board";

const Leads = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const { config } = usePricingConfig();
  const [isCreating, setIsCreating] = useState(false);
  const [newLead, setNewLead] = useState<LeadWithCalculation | null>(null);

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

  const handleCreateLead = () => {
    // Criar um lead vazio com valores padrão
    const emptyLead: Partial<LeadWithCalculation> = {
      id: 0, // ID temporário, será gerado pelo banco
      name: "",
      email: "",
      telefone: "",
      status: "novo",
      number_of_people: 1,
      check_in_start: new Date().toISOString().split('T')[0],
      check_in_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tipo_de_quarto: "",
      room_category: "Select",
      room_type: "Select",
      pacote: null,
      aulas_de_surf: 0,
      aulas_de_yoga: 0,
      skate: 0,
      analise_de_video_extra: 0,
      analise_de_video_package: 0,
      massagem_extra: 0,
      massagem_package: 0,
      surf_guide_package: 0,
      transfer_extra: 0,
      transfer_package: 0,
      breakfast: false,
      aluguel_de_prancha: false,
      hike_extra: false,
      rio_city_tour: false,
      carioca_experience: false,
      obs_do_cliente: "",
      created_at: new Date().toISOString(),
    };
    
    setNewLead(calculateLeadPrice(emptyLead as any, config));
    setIsCreating(true);
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header com título e controles */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between gap-3 mb-1">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Leads</h1>
          
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

      {/* Botão flutuante para criar novo lead */}
      <Button
        onClick={handleCreateLead}
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50"
        size="icon"
        title="Criar Novo Lead"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Modal de criação de lead */}
      {newLead && (
        <CompleteLeadModal
          lead={newLead}
          isOpen={isCreating}
          onClose={() => {
            setIsCreating(false);
            setNewLead(null);
          }}
        />
      )}
    </div>
  );
};

export default Leads;