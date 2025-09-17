import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { LeadCard } from "./LeadCard";
import { LeadWithCalculation, calculateLeadPrice } from "@/types/leads";
import { DroppableColumn } from "./DroppableColumn";
import { usePricingConfig } from "@/hooks/usePricingConfig";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useState, useEffect } from "react";
import { toast } from "sonner";

type Lead = Tables<"notion_reservas">;

const defaultColumns = [
  { id: "novo", title: "Novos", status: "novo" },
  { id: "contato", title: "Em Contato", status: "contato" },
  { id: "proposta", title: "Proposta Enviada", status: "proposta" },
  { id: "confirmado", title: "Confirmado", status: "confirmado" },
  { id: "cancelado", title: "Cancelado", status: "cancelado" },
];

// Função para carregar/salvar configurações de status
const getStatusConfig = () => {
  try {
    const saved = localStorage.getItem('leads-status-config');
    return saved ? JSON.parse(saved) : defaultColumns;
  } catch {
    return defaultColumns;
  }
};

const saveStatusConfig = (config: typeof defaultColumns) => {
  localStorage.setItem('leads-status-config', JSON.stringify(config));
};

export const LeadsBoard = () => {
  const { config } = usePricingConfig();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [columns, setColumns] = useState(defaultColumns);
  const [editingColumn, setEditingColumn] = useState<string | null>(null);

  // Carregar configurações salvas
  useEffect(() => {
    setColumns(getStatusConfig());
  }, []);

  // Função para atualizar o título de uma coluna
  const updateColumnTitle = (columnId: string, newTitle: string) => {
    const updatedColumns = columns.map(col =>
      col.id === columnId ? { ...col, title: newTitle } : col
    );
    setColumns(updatedColumns);
    saveStatusConfig(updatedColumns);
    setEditingColumn(null);
    toast.success("Nome do status atualizado!");
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data: leads, isLoading } = useQuery({
    queryKey: ["leads-board", config],
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

  const updateLeadStatusMutation = useMutation({
    mutationFn: async ({ leadId, newStatus }: { leadId: number, newStatus: string | null }) => {
      const { data, error } = await supabase
        .from("notion_reservas")
        .update({ status: newStatus })
        .eq("id", leadId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads-board"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Status atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

  const getLeadsByStatus = (status: string | null) => {
    if (!leads) return [];

    if (status === null) {
      // Sem status: não deve haver leads aqui, pois novos leads vão para "novo"
      return [];
    }

    if (status === "novo") {
      // Leads novos: sem status definido OU com status "novo"
      return leads.filter((lead) =>
        !lead.status ||
        lead.status === "" ||
        lead.status?.toLowerCase() === "novo"
      );
    }

    return leads.filter((lead) =>
      lead.status?.toLowerCase() === status.toLowerCase()
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const leadId = parseInt(active.id as string);
    const newColumnId = over.id as string;
    const newStatus = columns.find(col => col.id === newColumnId)?.status || null;

    const currentLead = leads?.find(lead => lead.id === leadId);
    if (!currentLead) return;

    // Se o status mudou, atualizar
    if (currentLead.status !== newStatus) {
      updateLeadStatusMutation.mutate({ leadId, newStatus });
    }

    setActiveId(null);
  };

  const activeLead = activeId ? leads?.find(lead => lead.id === parseInt(activeId)) : null;

  if (isLoading) {
    return (
      <div className="p-3 sm:p-4 lg:p-6">
        {/* Mobile loading */}
        <div className="block sm:hidden">
          <div className="flex gap-3 overflow-x-auto pb-4">
            {columns.map((column) => (
              <div key={column.id} className="flex-shrink-0 w-[280px] space-y-3">
                <div className="h-6 bg-muted animate-pulse rounded" />
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Desktop loading */}
        <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
          {columns.map((column) => (
            <div key={column.id} className="space-y-3 sm:space-y-4">
              <div className="h-6 bg-muted animate-pulse rounded" />
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 sm:h-32 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="p-3 sm:p-4 lg:p-6">
        {/* Mobile: Horizontal scroll */}
        <div className="block sm:hidden">
          <div className="flex gap-3 overflow-x-auto pb-4">
            {columns.map((column) => (
              <div key={column.id} className="flex-shrink-0 w-[280px]">
                <DroppableColumn
                  id={column.id}
                  title={column.title}
                  leads={getLeadsByStatus(column.status)}
                  onTitleEdit={(newTitle) => updateColumnTitle(column.id, newTitle)}
                  isEditing={editingColumn === column.id}
                  onStartEdit={() => setEditingColumn(column.id)}
                  onCancelEdit={() => setEditingColumn(null)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: Grid layout */}
        <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          {columns.map((column) => (
            <DroppableColumn
              key={column.id}
              id={column.id}
              title={column.title}
              leads={getLeadsByStatus(column.status)}
              onTitleEdit={(newTitle) => updateColumnTitle(column.id, newTitle)}
              isEditing={editingColumn === column.id}
              onStartEdit={() => setEditingColumn(column.id)}
              onCancelEdit={() => setEditingColumn(null)}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeLead ? <LeadCard lead={activeLead} /> : null}
      </DragOverlay>
    </DndContext>
  );
};