import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { LeadCard } from "./LeadCard";
import { LeadWithCalculation, calculateLeadPrice } from "@/types/leads";
import { DroppableColumn } from "./DroppableColumn";
import { SortableColumn } from "./SortableColumn";
import { usePricingConfig } from "@/hooks/usePricingConfig";
import { useRegion, applyRegion, type Region } from "@/contexts/RegionContext";
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
const generateDefaultColumns = async (region: Region): Promise<StatusInfo[]> => {
  try {
    // Buscar status únicos dos dados reais
    const { data: statusData } = await applyRegion(
      supabase.from('reservations').select('status'),
      region,
    ).not('status', 'is', null);

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
    const { count: noStatusCount } = await applyRegion(
      supabase.from('reservations').select('*', { count: 'exact', head: true }),
      region,
    ).or('status.is.null,status.eq.');

    // Ordem padrão dos status conforme solicitado
    const defaultStatusOrder = [
      'novo',
      'dúvidas',
      'orçamento enviado',
      'fup 1',
      'link de pagamento enviado',
      'pago | a se hospedar',
      'hospedado',
      'hospedagem concluída',
      'perdido',
      'origem'
    ];

    const columns: StatusInfo[] = [];
    
    // Primeiro, adicionar status na ordem padrão
    defaultStatusOrder.forEach((statusName, index) => {
      let count = 0;
      let statusId = statusName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      if (statusName === 'novo') {
        count = (noStatusCount || 0) + (statusCounts['novo'] || 0);
        statusId = 'novo';
      } else {
        // Buscar por variações do nome do status
        const matchingStatus = Object.keys(statusCounts).find(key => 
          key.toLowerCase().includes(statusName.toLowerCase()) ||
          statusName.toLowerCase().includes(key.toLowerCase())
        );
        if (matchingStatus) {
          count = statusCounts[matchingStatus];
        }
      }
      
      columns.push({
        id: statusId,
        title: statusName,
        status: statusName,
        count: count,
        color: getStatusColor(index)
      });
    });

    // Depois, adicionar outros status encontrados nos dados que não estão na ordem padrão
    Object.entries(statusCounts).forEach(([status, count], index) => {
      const normalizedStatus = status.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const alreadyAdded = columns.some(col => 
        col.status.toLowerCase().includes(status.toLowerCase()) ||
        status.toLowerCase().includes(col.status.toLowerCase())
      );
      
      if (!alreadyAdded && status !== 'novo') {
        columns.push({
          id: normalizedStatus,
          title: status,
          status: status,
          count: count,
          color: getStatusColor(columns.length)
        });
      }
    });

    return columns;
  } catch (e) {
    console.error('Erro ao gerar colunas padrão:', e);
    return [
      { id: "novo", title: "Novos", status: "novo", count: 0, color: "#6B7280" },
      { id: "duvidas", title: "Dúvidas", status: "dúvidas", count: 0, color: "#EF4444" },
      { id: "orcamento-enviado", title: "Orçamento Enviado", status: "orçamento enviado", count: 0, color: "#F97316" },
      { id: "fup-1", title: "FUP 1", status: "fup 1", count: 0, color: "#EAB308" },
      { id: "link-de-pagamento-enviado", title: "Link de Pagamento Enviado", status: "link de pagamento enviado", count: 0, color: "#22C55E" },
      { id: "pago-a-se-hospedar", title: "Pago | A se Hospedar", status: "pago | a se hospedar", count: 0, color: "#10B981" },
      { id: "perdido", title: "Perdido", status: "perdido", count: 0, color: "#F43F5E" },
      { id: "hospedagem-concluida", title: "Hospedagem Concluída", status: "hospedagem concluída", count: 0, color: "#6366F1" },
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
const getStatusConfig = async (region: Region): Promise<StatusInfo[]> => {
  try {
    // Sempre gerar nova configuração com ordem padrão
    const defaultColumns = await generateDefaultColumns(region);
    localStorage.setItem('leads-status-config', JSON.stringify(defaultColumns));
    return defaultColumns;
  } catch {
    return await generateDefaultColumns(region);
  }
};

const saveStatusConfig = (config: StatusInfo[]) => {
  localStorage.setItem('leads-status-config', JSON.stringify(config));
};

export const LeadsBoard = () => {
  const region = useRegion();
  console.log("🚀 LeadsBoard component iniciado!");
  const { config } = usePricingConfig(region);
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [columns, setColumns] = useState<StatusInfo[]>([]);
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [isLoadingColumns, setIsLoadingColumns] = useState(true);
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'updated', direction: 'desc' });
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({ search: '' });

  // Carregar configurações salvas
  useEffect(() => {
    const loadColumns = async () => {
      setIsLoadingColumns(true);
      try {
        const loadedColumns = await getStatusConfig(region);
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
    queryKey: ["leads-board", region, config],
    queryFn: async () => {
      console.log("🔍 Fazendo query na tabela reservas...");

      // Primeiro, vamos testar uma query simples para ver se há dados
      const testQuery = await applyRegion(
        supabase.from("reservations").select("id, name"),
        region,
      ).limit(5);

      console.log("🧪 Teste simples na tabela:", testQuery);

      const { data, error } = await applyRegion(
        supabase.from("reservations").select("*"),
        region,
      ).order('updated_at', { ascending: false }); // Ordenar por updated_at (mais recentes primeiro)

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
      console.log("📝 [MUTATION] Iniciando atualização de status:", { 
        leadId, 
        leadIdType: typeof leadId,
        newStatus 
      });
      
      // Primeiro, buscar o lead atual para preservar os campos de preço
      const { data: currentLead, error: fetchError } = await supabase
        .from("reservations")
        .select("accommodation_price_override, extra_fee_amount, extra_fee_description, room_category, room_type")
        .eq("id", leadId)
        .single();

      if (fetchError) {
        console.error("❌ [MUTATION] Erro ao buscar lead atual:", fetchError);
        throw fetchError;
      }

      // Preparar dados de atualização preservando os campos de preço
      const updateData: any = { status: newStatus };
      
      // Preservar campos de preço se existirem (incluir mesmo se for 0 ou string vazia)
      if (currentLead?.accommodation_price_override !== null && currentLead?.accommodation_price_override !== undefined) {
        updateData.accommodation_price_override = currentLead.accommodation_price_override;
      }
      if (currentLead?.extra_fee_amount !== null && currentLead?.extra_fee_amount !== undefined) {
        updateData.extra_fee_amount = currentLead.extra_fee_amount;
      }
      if (currentLead?.extra_fee_description !== null && currentLead?.extra_fee_description !== undefined && currentLead.extra_fee_description !== '') {
        updateData.extra_fee_description = currentLead.extra_fee_description;
      }
      if (currentLead?.room_category !== null && currentLead?.room_category !== undefined && currentLead.room_category !== '') {
        updateData.room_category = currentLead.room_category;
      }
      if (currentLead?.room_type !== null && currentLead?.room_type !== undefined && currentLead.room_type !== '') {
        updateData.room_type = currentLead.room_type;
      }
      
      const { data, error } = await supabase
        .from("reservations")
        .update(updateData)
        .eq("id", leadId)
        .select()
        .single();

      if (error) {
        console.error("❌ [MUTATION] Erro ao atualizar status:", error);
        throw error;
      }
      
      console.log("✅ [MUTATION] Status atualizado com sucesso no banco:", data);
      return data;
    },
    onSuccess: (data) => {
      console.log("🔄 [MUTATION] Invalidando queries após sucesso, dados retornados:", data);
      queryClient.invalidateQueries({ queryKey: ["leads-board"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Status atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("❌ [MUTATION] Erro na mutation:", error);
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
        case 'updated':
          aValue = new Date(a.updated_at || 0).getTime();
          bValue = new Date(b.updated_at || 0).getTime();
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
          // Ordenação padrão por updated_at (mais recente primeiro)
          aValue = new Date(a.updated_at || 0).getTime();
          bValue = new Date(b.updated_at || 0).getTime();
          // Sempre decrescente para updated_at por padrão
          return bValue - aValue;
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
      console.log("🔄 Iniciando drag de coluna:", activeId);
      setDraggedColumnId(activeId);
    } else {
      console.log("🔄 Iniciando drag de lead:", activeId);
      setActiveId(activeId);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    console.log("📦 DragEnd event:", { 
      activeId: active.id, 
      activeType: typeof active.id,
      overId: over?.id,
      overType: typeof over?.id 
    });

    if (!over) {
      console.log("⚠️ No drop target");
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
    const leadIdString = activeId;
    const newColumnId = overId;
    
    // Converter ID para número se necessário
    const leadId = parseInt(leadIdString);
    
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
      console.error("Lead não encontrado:", { leadIdString, leadId, availableLeads: leads?.map(l => l.id) });
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
      leadName: currentLead.name,
      currentStatus: currentLead.status,
      currentStatusNormalized: currentStatus, 
      newStatus,
      targetStatusNormalized: targetStatus,
      targetColumn: targetColumn.title,
      willUpdate: currentStatus !== targetStatus 
    });

    // Se o status mudou, atualizar
    if (currentStatus !== targetStatus) {
      // Atualizar para o status real da coluna (não o normalizado)
      const statusToSave = newStatus === "novo" ? "novo" : newStatus;
      console.log("✅ Chamando mutation para atualizar lead status para:", statusToSave);
      updateLeadStatusMutation.mutate({ leadId, newStatus: statusToSave });
    } else {
      console.log("ℹ️ Lead já está neste status, sem mudanças");
    }

    setActiveId(null);
  };

  const activeLead = activeId ? leads?.find(lead => lead.id === parseInt(activeId)) : null;

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