import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { LeadCard } from "./LeadCard";
import { LeadWithCalculation, calculateLeadPrice } from "@/types/leads";
import { DroppableColumn } from "./DroppableColumn";
import { SortableColumn } from "./SortableColumn";
import { usePricingConfig } from "@/hooks/usePricingConfig";
// Componentes removidos: StatusManager e BulkStatusEditor
import { SortOptions, SortConfig } from "./SortOptions";
import { FilterOptions, FilterConfig } from "./FilterOptions";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface StatusInfo {
  id: string;
  title: string;
  status: string;
  count: number;
  color?: string;
}

type Lead = Tables<"reservations">;

// Função para gerar configuração padrão baseada nos dados reais
const generateDefaultColumns = async (): Promise<StatusInfo[]> => {
  try {
    // Buscar status únicos dos dados reais
    const { data: statusData } = await supabase
      .from('reservations')
      .select('status')
      .not('status', 'is', null);

    const statusCounts: Record<string, number> = {};
    statusData?.forEach(item => {
      if (item.status) {
        let status = item.status.trim();
        // Mapear "Lead" para contabilizar na coluna "Novos"
        if (status.toLowerCase() === 'lead') {
          status = 'novo'; // Mapear internamente para novo
        }
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      }
    });

    // Buscar leads sem status
    const { count: noStatusCount } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .or('status.is.null,status.eq.');

    const columns: StatusInfo[] = [
      {
        id: "novo",
        title: "Novos",
        status: "novo",
        count: (noStatusCount || 0) + (statusCounts['novo'] || 0),
        color: "#6B7280"
      }
    ];

    // Adicionar status encontrados nos dados (exceto "novo" que já foi adicionado)
    Object.entries(statusCounts).forEach(([status, count], index) => {
      if (status !== 'novo') { // Evitar duplicar a coluna "Novos"
        columns.push({
          id: status.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          title: status,
          status: status,
          count: count,
          color: getStatusColor(index + 1)
        });
      }
    });

    return columns;
  } catch (e) {
    console.error('Erro ao gerar colunas padrão:', e);
    return [
      { id: "novo", title: "Novos", status: "novo", count: 0 },
      { id: "contato", title: "Em Contato", status: "contato", count: 0 },
      { id: "proposta", title: "Proposta Enviada", status: "proposta", count: 0 },
      { id: "confirmado", title: "Confirmado", status: "confirmado", count: 0 },
      { id: "cancelado", title: "Cancelado", status: "cancelado", count: 0 },
    ];
  }
};

const getStatusColor = (index: number) => {
  const colors = [
    "#EF4444", "#F97316", "#EAB308", "#22C55E",
    "#06B6D4", "#3B82F6", "#8B5CF6", "#EC4899",
    "#F43F5E", "#84CC16", "#10B981", "#6366F1"
  ];
  return colors[index % colors.length];
};

// Função para carregar/salvar configurações de status
const getStatusConfig = async (): Promise<StatusInfo[]> => {
  try {
    const saved = localStorage.getItem('leads-status-config');
    if (saved) {
      return JSON.parse(saved);
    }

    // Se não há configuração salva, gerar a partir dos dados reais
    const defaultColumns = await generateDefaultColumns();
    localStorage.setItem('leads-status-config', JSON.stringify(defaultColumns));
    return defaultColumns;
  } catch {
    return await generateDefaultColumns();
  }
};

const saveStatusConfig = (config: StatusInfo[]) => {
  localStorage.setItem('leads-status-config', JSON.stringify(config));
};

export const LeadsBoard = () => {
  console.log("🚀 LeadsBoard component iniciado!");
  const { config } = usePricingConfig();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [columns, setColumns] = useState<StatusInfo[]>([]);
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [isLoadingColumns, setIsLoadingColumns] = useState(true);
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'created', direction: 'desc' });
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({ search: '' });

  // Carregar configurações salvas
  useEffect(() => {
    const loadColumns = async () => {
      setIsLoadingColumns(true);
      try {
        const loadedColumns = await getStatusConfig();
        setColumns(loadedColumns);
      } catch (e) {
        console.error('Erro ao carregar colunas:', e);
        setColumns([
          { id: "novo", title: "Novos", status: "novo", count: 0 }
        ]);
      } finally {
        setIsLoadingColumns(false);
      }
    };

    loadColumns();
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

  // Função para atualizar status (simplificada)
  const handleStatusChange = (newStatuses: StatusInfo[]) => {
    setColumns(newStatuses);
  };

  // Função para adicionar novo lead (placeholder)
  const handleAddCard = (columnId: string) => {
    // TODO: Implementar modal de criação de lead
    console.log('Add card to column:', columnId);
  };

  // Função para deletar coluna
  const handleDeleteColumn = (columnId: string) => {
    const updatedColumns = columns.filter(col => col.id !== columnId);
    setColumns(updatedColumns);
    saveStatusConfig(updatedColumns);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Distância mínima para ativar o drag
        delay: 0, // Sem delay para feedback instantâneo
        tolerance: 5,
      },
    })
  );

  const { data: leads, isLoading, error: queryError } = useQuery({
    queryKey: ["leads-board", config],
    queryFn: async () => {
      console.log("🔍 Fazendo query na tabela reservas...");

      // Primeiro, vamos testar uma query simples para ver se há dados
      const testQuery = await supabase
        .from("reservations")
        .select("id, name")
        .limit(5);

      console.log("🧪 Teste simples na tabela:", testQuery);

      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .order('created_at', { ascending: false });

      console.log("📊 Resultado da query:", { data, error, count: data?.length });

      if (data && data.length > 0) {
        const statusSummary = data.reduce((acc, lead) => {
          const status = lead.status || 'sem_status';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        console.log("📋 Resumo de status:", statusSummary);
        console.log("🏷️ Primeiros 5 leads:", data.slice(0, 5).map(l => ({
          id: l.id,
          nome: l.nome || l.name,
          status: l.status,
          created_at: l.created_at
        })));
      }

      if (error) {
        console.error("❌ Erro na query:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn("⚠️ Nenhum lead encontrado na tabela reservas");
        return [];
      }

      console.log("🎯 Calculando preços para", data.length, "leads");
      const leadsWithCalculation: LeadWithCalculation[] = data.map(lead =>
        calculateLeadPrice(lead, config)
      );

      console.log("✅ Leads processados:", leadsWithCalculation);
      return leadsWithCalculation;
    },
    staleTime: 0, // Forçar recarregamento sempre
    refetchInterval: 10000, // Recarregar a cada 10 segundos
  });

  // Log para debugging
  console.log("🔄 LeadsBoard state:", { leads: leads?.length, isLoading, queryError });

  // Verificar se há erro de renderização
  if (queryError) {
    console.error("❌ Query error in LeadsBoard:", queryError);
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Erro ao carregar leads: {queryError.message}</div>
      </div>
    );
  }

  const updateLeadStatusMutation = useMutation({
    mutationFn: async ({ leadId, newStatus }: { leadId: string | number, newStatus: string | null }) => {
      console.log("📝 Iniciando atualização de status:", { leadId, newStatus });
      
      const { data, error } = await supabase
        .from("reservations")
        .update({ status: newStatus })
        .eq("id", leadId)
        .select()
        .single();

      if (error) {
        console.error("❌ Erro ao atualizar status:", error);
        throw error;
      }
      
      console.log("✅ Status atualizado com sucesso:", data);
      return data;
    },
    onSuccess: (data) => {
      console.log("🔄 Invalidando queries após sucesso");
      queryClient.invalidateQueries({ queryKey: ["leads-board"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Status atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("❌ Erro na mutation:", error);
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

  // Função para filtrar leads
  const filterLeads = (leads: LeadWithCalculation[]) => {
    try {
      let filtered = leads;

      console.log(`🔧 Applying filters to ${leads.length} leads:`, filterConfig);

    // Busca por texto
    if (filterConfig.search) {
      const search = filterConfig.search.toLowerCase();
      filtered = filtered.filter(lead => {
        const name = lead.name || lead.nome || '';
        const email = lead.email || '';
        const telefone = lead.telefone || lead.phone || '';

        return name.toLowerCase().includes(search) ||
               email.toLowerCase().includes(search) ||
               telefone.toLowerCase().includes(search);
      });
    }

    // Filtro por tipo de quarto
    if (filterConfig.room_type) {
      filtered = filtered.filter(lead => lead.tipo_de_quarto === filterConfig.room_type);
    }

    // Filtro por pacote
    if (filterConfig.package) {
      filtered = filtered.filter(lead => lead.pacote === filterConfig.package);
    }

    // Filtro por número de pessoas
    if (filterConfig.min_people) {
      filtered = filtered.filter(lead => {
        const numPeople = lead.number_of_people || lead.numero_de_pessoas || 0;
        return numPeople >= filterConfig.min_people!;
      });
    }
    if (filterConfig.max_people) {
      filtered = filtered.filter(lead => {
        const numPeople = lead.number_of_people || lead.numero_de_pessoas || 0;
        return numPeople <= filterConfig.max_people!;
      });
    }

    // Filtro por email
    if (filterConfig.has_email) {
      filtered = filtered.filter(lead => lead.email && lead.email.trim() !== '');
    }

    // Filtro por telefone
    if (filterConfig.has_phone) {
      filtered = filtered.filter(lead => {
        const phone = lead.telefone || lead.phone || '';
        return phone.trim() !== '';
      });
    }

      console.log(`✅ Filtered result: ${filtered.length} leads`);
      return filtered;
    } catch (error) {
      console.error("❌ Error in filterLeads:", error);
      return leads; // Retornar os leads originais em caso de erro
    }
  };

  // Função para ordenar leads
  const sortLeads = (leads: LeadWithCalculation[]) => {
    return [...leads].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.field) {
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'email':
          aValue = (a.email || '').toLowerCase();
          bValue = (b.email || '').toLowerCase();
          break;
        case 'created':
          aValue = new Date(a.created_at || 0).getTime();
          bValue = new Date(b.created_at || 0).getTime();
          break;
        case 'checkin':
          aValue = new Date(a.check_in_start || 0).getTime();
          bValue = new Date(b.check_in_start || 0).getTime();
          break;
        case 'price':
          aValue = a.totalPrice || 0;
          bValue = b.totalPrice || 0;
          break;
        case 'people':
          aValue = a.number_of_people || 0;
          bValue = b.number_of_people || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const getLeadsByStatus = (status: string | null) => {
    if (!leads) return [];

    let statusLeads: LeadWithCalculation[] = [];

    if (status === null) {
      // Sem status: não deve haver leads aqui, pois novos leads vão para "novo"
      statusLeads = [];
    } else if (status === "novo") {
      // Leads novos: sem status definido OU com status "novo" OU "lead"
      statusLeads = leads.filter((lead) =>
        !lead.status ||
        lead.status === "" ||
        lead.status?.toLowerCase() === "novo" ||
        lead.status?.toLowerCase() === "lead"
      );
    } else {
      statusLeads = leads.filter((lead) =>
        lead.status?.toLowerCase() === status.toLowerCase()
      );
    }

    // Log específico para debug de filtros
    console.log(`🔍 getLeadsByStatus("${status}"):`, {
      totalLeads: leads?.length || 0,
      statusLeads: statusLeads.length,
      sample: statusLeads.slice(0, 2).map(l => ({
        id: l.id,
        nome: l.nome || l.name,
        status: l.status
      }))
    });

    // Aplicar filtros e ordenação
    const filtered = filterLeads(statusLeads);
    const sorted = sortLeads(filtered);

    console.log(`✅ Final result for "${status}":`, sorted.length, "leads");

    return sorted;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = event.active.id as string;

    // Verificar se é uma coluna ou um lead
    const isColumn = columns.some(col => col.id === activeId);

    if (isColumn) {
      setDraggedColumnId(activeId);
    } else {
      setActiveId(activeId);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      setDraggedColumnId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Verificar se estamos movendo uma coluna
    if (draggedColumnId) {
      if (activeId !== overId) {
        setColumns((columns) => {
          const oldIndex = columns.findIndex(col => col.id === activeId);
          const newIndex = columns.findIndex(col => col.id === overId);

          const newColumns = arrayMove(columns, oldIndex, newIndex);
          saveStatusConfig(newColumns);
          return newColumns;
        });
      }
      setDraggedColumnId(null);
      return;
    }

    // Lógica original para mover leads
    const leadId = activeId;
    const newColumnId = overId;
    
    // Encontrar o status da coluna de destino
    const targetColumn = columns.find(col => col.id === newColumnId);
    if (!targetColumn) {
      console.error("Coluna de destino não encontrada:", newColumnId);
      setActiveId(null);
      return;
    }
    
    const newStatus = targetColumn.status;

    const currentLead = leads?.find(lead => lead.id === leadId);
    if (!currentLead) {
      console.error("Lead não encontrado:", leadId);
      setActiveId(null);
      return;
    }

    // Normalizar status para comparação (tratar "novo", "lead", null e "" como equivalentes)
    const normalizeStatus = (status: string | null | undefined): string => {
      if (!status || status === "" || status.toLowerCase() === "lead") return "novo";
      return status.toLowerCase();
    };

    const currentStatus = normalizeStatus(currentLead.status);
    const targetStatus = normalizeStatus(newStatus);

    console.log("🔄 Drag and drop:", { 
      leadId, 
      currentStatus, 
      targetStatus, 
      willUpdate: currentStatus !== targetStatus 
    });

    // Se o status mudou, atualizar
    if (currentStatus !== targetStatus) {
      // Atualizar para o status real da coluna (não o normalizado)
      const statusToSave = newStatus === "novo" ? "novo" : newStatus;
      console.log("✅ Atualizando lead status para:", statusToSave);
      updateLeadStatusMutation.mutate({ leadId, newStatus: statusToSave });
    } else {
      console.log("ℹ️ Lead já está neste status, sem mudanças");
    }

    setActiveId(null);
  };

  const activeLead = activeId ? leads?.find(lead => lead.id === activeId) : null;

  if (isLoading || isLoadingColumns) {
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

  try {
    console.log("🎯 Rendering LeadsBoard with:", {
      leads: leads?.length,
      columns: columns?.length,
      filterConfig,
      isLoading
    });

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="p-3 sm:p-4 lg:p-6">
        {/* Header minimalista */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-2 sm:gap-1">
            <FilterOptions
              filterConfig={filterConfig}
              onFilterChange={(config) => {
                console.log("🔧 Filter config changed:", config);
                setFilterConfig(config);
              }}
              roomTypes={(() => {
                try {
                  const types = leads?.map(l => l.tipo_de_quarto).filter(Boolean) || [];
                  return [...new Set(types)];
                } catch (error) {
                  console.error("❌ Error extracting room types:", error);
                  return [];
                }
              })()}
              packages={(() => {
                try {
                  const packages = leads?.map(l => l.pacote).filter(Boolean) || [];
                  return [...new Set(packages)];
                } catch (error) {
                  console.error("❌ Error extracting packages:", error);
                  return [];
                }
              })()}
            />
            <SortOptions
              sortConfig={sortConfig}
              onSortChange={setSortConfig}
            />
          </div>
        </div>
        {/* Mobile: Horizontal scroll */}
        <div className="block sm:hidden">
          <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory" style={{
            scrollbarWidth: 'thin',
            WebkitOverflowScrolling: 'touch'
          }}>
            {columns.map((column) => (
              <div key={column.id} className="flex-shrink-0 w-[85vw] snap-center">
                <DroppableColumn
                  id={column.id}
                  title={column.title}
                  leads={getLeadsByStatus(column.status)}
                  onTitleEdit={(newTitle) => updateColumnTitle(column.id, newTitle)}
                  isEditing={editingColumn === column.id}
                  onStartEdit={() => setEditingColumn(column.id)}
                  onCancelEdit={() => setEditingColumn(null)}
                  color={column.color}
                />
              </div>
            ))}
          </div>
          {/* Indicador de scroll */}
          <div className="flex justify-center gap-1 mt-2">
            {columns.map((col, idx) => (
              <div 
                key={col.id} 
                className={`h-1 rounded-full transition-all ${
                  idx === 0 ? 'w-3 bg-primary' : 'w-1 bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Desktop: Horizontal scroll layout with sortable columns */}
        <div className="hidden sm:block">
          <div className="flex gap-4 lg:gap-6 overflow-x-auto pb-4" style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 #f1f5f9'
          }}>
            <SortableContext items={columns.map(col => col.id)} strategy={horizontalListSortingStrategy}>
              {columns.map((column) => (
                <SortableColumn
                  key={column.id}
                  column={column}
                  leads={getLeadsByStatus(column.status)}
                  onTitleEdit={(newTitle) => updateColumnTitle(column.id, newTitle)}
                  onAddCard={() => handleAddCard(column.id)}
                  onDeleteColumn={() => handleDeleteColumn(column.id)}
                  isEditing={editingColumn === column.id}
                  onStartEdit={() => setEditingColumn(column.id)}
                  onCancelEdit={() => setEditingColumn(null)}
                />
              ))}
            </SortableContext>
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeLead ? <LeadCard lead={activeLead} /> : null}
      </DragOverlay>
      </DndContext>
    );
  } catch (error) {
    console.error("❌ Critical error in LeadsBoard render:", error);
    return (
      <div className="flex items-center justify-center h-64 p-8">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">Erro no Board</div>
          <div className="text-gray-600 text-sm">{error instanceof Error ? error.message : 'Erro desconhecido'}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }
};