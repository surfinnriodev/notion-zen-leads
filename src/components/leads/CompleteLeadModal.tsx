import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LeadWithCalculation, calculateLeadPrice, mapReservaToLegacyFormat } from "@/types/leads";
import { usePricingConfig, AVAILABLE_PRICING_ITEMS } from "@/hooks/usePricingConfig";
import { useRegion } from "@/contexts/RegionContext";
import { useKanbanStatuses } from "@/hooks/useKanbanStatuses";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, User, Calendar, Home, Activity, Trash2, Receipt } from "lucide-react";
import { CotacaoPanel } from "./CotacaoPanel";
import { toast } from "sonner";

interface CompleteLeadModalProps {
  lead: LeadWithCalculation | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CompleteLeadModal = ({ lead, isOpen, onClose }: CompleteLeadModalProps) => {
  const region = useRegion();
  const { config } = usePricingConfig(region);

  // Itens da configuração que NÃO têm campo fixo no formulário — ou seja, os que
  // o usuário criou em Configurações → Itens de Cobrança. Os fixos (café, aulas,
  // transfer…) já têm coluna e campo próprios e são tratados acima.
  const camposFixos = new Set(AVAILABLE_PRICING_ITEMS.map((i) => i.id));
  const ITENS_COM_CAMPO_PROPRIO = new Set([
    ...camposFixos,
    'breakfast', 'unlimited-board-rental', 'yoga-lesson', 'surf-skate',
    'analise_de_video', 'massage', 'surf-guide', 'transfer', 'hike',
    'rio-city-tour', 'carioca-experience', 'skate', 'surf-lesson',
  ]);
  const customItems = ((config as any)?.items || []).filter(
    (i: any) => i?.id && !ITENS_COM_CAMPO_PROPRIO.has(i.id),
  );
  const { statuses: kanbanStatuses } = useKanbanStatuses();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<LeadWithCalculation>>({});
  const [calculatedLead, setCalculatedLead] = useState<LeadWithCalculation | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Função para converter nome do pacote para ID
  const getPackageIdFromName = (packageName: string | null): string | null => {
    if (!packageName || !config.packages) return null;
    
    const packageConfig = config.packages.find((pkg: any) => pkg.name === packageName);
    return packageConfig ? packageConfig.id : null;
  };

  // Função para converter ID do pacote para nome
  const getPackageNameFromId = (packageId: string | null): string | null => {
    if (!packageId || !config.packages) return null;
    
    const packageConfig = config.packages.find((pkg: any) => pkg.id === packageId);
    return packageConfig ? packageConfig.name : null;
  };

  // Inicializar formData quando o lead muda
  useEffect(() => {
    if (lead) {
      // Mapear para o formato legado para compatibilidade
      const legacyLead = mapReservaToLegacyFormat(lead);
      
      // Converter nome do pacote para ID se necessário
      if (lead.pacote) {
        const packageId = getPackageIdFromName(lead.pacote);
        legacyLead.pacote = packageId || lead.pacote; // Fallback para o nome original se não encontrar ID
      }
      
      // Inicializar room_category e room_type se ainda não existirem
      if (!lead.room_category && lead.tipo_de_quarto) {
        // Extrair categoria e tipo do campo tipo_de_quarto
        if (lead.tipo_de_quarto.includes('Private:')) {
          legacyLead.room_category = 'Private';
          legacyLead.room_type = lead.tipo_de_quarto.replace('Private: ', '').trim();
        } else if (lead.tipo_de_quarto.includes('Shared:')) {
          legacyLead.room_category = 'Shared';
          legacyLead.room_type = lead.tipo_de_quarto.replace('Shared: ', '').trim();
        } else if (lead.tipo_de_quarto === 'Without room') {
          legacyLead.room_category = 'Without Room';
          legacyLead.room_type = '';
        }
      } else {
        legacyLead.room_category = lead.room_category || '';
        legacyLead.room_type = lead.room_type || '';
      }

      setFormData(legacyLead);
      setCalculatedLead(calculateLeadPrice(lead, config));
    }
  }, [lead, config]);

  const deleteMutation = useMutation({
    mutationFn: async (leadId: number) => {
      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("id", leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads-board"] });
      toast.success("Lead excluído com sucesso!");
      onClose();
    },
    onError: (error) => {
      toast.error("Erro ao excluir lead: " + error.message);
    },
  });

  const isCreating = lead && lead.id === 0;

  const updateMutation = useMutation({
    mutationFn: async (updatedData: Partial<LeadWithCalculation>) => {
      if (!lead) throw new Error("No lead to update");

      // Mapear campos para a nova estrutura da tabela reservations
      const mappedData: any = {};

      if (updatedData.name !== undefined) mappedData.name = updatedData.name;
      if (updatedData.email !== undefined) mappedData.email = updatedData.email;
      if (updatedData.telefone !== undefined) mappedData.telefone = updatedData.telefone;
      if (updatedData.status !== undefined) mappedData.status = updatedData.status;
      if (updatedData.number_of_people !== undefined) mappedData.number_of_people = updatedData.number_of_people;
      if (updatedData.tipo_de_quarto !== undefined) mappedData.tipo_de_quarto = updatedData.tipo_de_quarto;
      if (updatedData.pacote !== undefined) {
        // Converter ID do pacote para nome antes de salvar
        const packageName = getPackageNameFromId(updatedData.pacote);
        mappedData.pacote = packageName || updatedData.pacote;
      }
      if (updatedData.obs_do_cliente !== undefined) mappedData.obs_do_cliente = updatedData.obs_do_cliente;
      if (updatedData.resumo_dos_servicos !== undefined) mappedData.resumo_dos_servicos = updatedData.resumo_dos_servicos;
      if (updatedData.nivel_de_surf !== undefined) mappedData.nivel_de_surf = updatedData.nivel_de_surf;
      if (updatedData.notion_page_id !== undefined) mappedData.notion_page_id = updatedData.notion_page_id;

      // Atividades - mapear para os campos corretos da tabela reservations
      if (updatedData.aulas_de_surf !== undefined) mappedData.aulas_de_surf = Number(updatedData.aulas_de_surf) || 0;
      if (updatedData.aulas_de_yoga !== undefined) mappedData.aulas_de_yoga = Number(updatedData.aulas_de_yoga) || 0;
      if (updatedData.skate !== undefined) mappedData.skate = Number(updatedData.skate) || 0;
      // Mapear analise_de_video_extra (do formulário) para analise_de_video (banco de dados)
      if (updatedData.analise_de_video_extra !== undefined) mappedData.analise_de_video = Number(updatedData.analise_de_video_extra) || 0;
      if (updatedData.analise_de_video_package !== undefined) mappedData.analise_de_video_package = Number(updatedData.analise_de_video_package) || 0;
      if (updatedData.massagem_extra !== undefined) mappedData.massagem_extra = Number(updatedData.massagem_extra) || 0;
      if (updatedData.massagem_package !== undefined) mappedData.massagem_package = Number(updatedData.massagem_package) || 0;
      if (updatedData.surf_guide_package !== undefined) mappedData.surf_guide_package = Number(updatedData.surf_guide_package) || 0;
      if (updatedData.transfer_extra !== undefined) mappedData.transfer_extra = Number(updatedData.transfer_extra) || 0;

      // Itens criados em Configurações (id -> quantidade). Guarda só os > 0, pra
      // não acumular zeros no JSON conforme os itens vão e vêm da configuração.
      if (updatedData.custom_items !== undefined) {
        const limpos = Object.fromEntries(
          Object.entries(updatedData.custom_items || {}).filter(([, q]) => Number(q) > 0),
        );
        mappedData.custom_items = Object.keys(limpos).length > 0 ? limpos : null;
      }
      if (updatedData.transfer_package !== undefined) mappedData.transfer_package = Number(updatedData.transfer_package) || 0;

      // Booleans fields - mapping to correct database field names
      if (updatedData.breakfast !== undefined) mappedData.breakfast = Boolean(updatedData.breakfast);
      if (updatedData.aluguel_de_prancha !== undefined) mappedData.aluguel_de_prancha = Boolean(updatedData.aluguel_de_prancha);
      if (updatedData.hike_extra !== undefined) mappedData.hike_extra = Boolean(updatedData.hike_extra);
      if (updatedData.rio_city_tour !== undefined) mappedData.rio_city_tour = Boolean(updatedData.rio_city_tour);
      if (updatedData.carioca_experience !== undefined) mappedData.carioca_experience = Boolean(updatedData.carioca_experience);
      if (updatedData.surf_guide !== undefined) mappedData.surf_guide = Boolean(updatedData.surf_guide);

      // Datas - usar campos diretos ao invés de JSON
      if (updatedData.check_in_start !== undefined) mappedData.check_in_start = updatedData.check_in_start;
      if (updatedData.check_in_end !== undefined) mappedData.check_in_end = updatedData.check_in_end;

      // Novos campos de categoria de quarto
      if (updatedData.room_category !== undefined) mappedData.room_category = updatedData.room_category;
      if (updatedData.room_type !== undefined) mappedData.room_type = updatedData.room_type;

      // Verificar se é criação ou edição
      if (lead.id === 0) {
        // Criação de novo lead
        // Carimba a região da tela: sem isso o lead nasceria como Rio (region null).
        const { data, error } = await supabase
          .from("reservations")
          .insert({ ...mappedData, region })
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Atualização de lead existente
      const { data, error } = await supabase
        .from("reservations")
        .update(mappedData)
        .eq("id", lead.id)
        .select()
        .single();

      if (error) throw error;
      return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads-board"] });
      toast.success(isCreating ? "Lead criado com sucesso!" : "Lead atualizado com sucesso!");
      onClose();
    },
    onError: (error) => {
      toast.error(`Erro ao ${isCreating ? 'criar' : 'atualizar'} lead: ` + error.message);
    },
  });

  const handleInputChange = (field: string, value: any) => {
    let updatedData = { ...formData, [field]: value };

    // Sincronizar room_category e room_type com tipo_de_quarto
    if (field === 'room_category' || field === 'room_type') {
      const category = field === 'room_category' ? value : formData.room_category;
      const type = field === 'room_type' ? value : formData.room_type;
      
      console.log('🏠 Room change:', { field, value, category, type });
      
      // Atualizar tipo_de_quarto com o formato combinado
      if (category && type && category !== 'Without Room' && category !== 'Select' && type !== 'Select') {
        updatedData.tipo_de_quarto = `${category}: ${type}`;
        console.log('✅ Updated tipo_de_quarto:', updatedData.tipo_de_quarto);
      } else if (category === 'Without Room') {
        updatedData.tipo_de_quarto = 'Without room';
      } else {
        updatedData.tipo_de_quarto = '';
      }
    }

    // Atualizar atividades automaticamente quando o pacote muda
    if (field === 'pacote') {
      const selectedPackage = config.packages?.find(pkg => 
        pkg.id === value || pkg.name === value
      );
      
      if (selectedPackage?.includedItems) {
        // Atualizar todas as atividades incluídas no pacote
        updatedData.transfer_package = selectedPackage.includedItems.transfer || 0;
        updatedData.aulas_de_surf = selectedPackage.includedItems.surfLessons || 0;
        updatedData.aulas_de_yoga = selectedPackage.includedItems.yogaLessons || 0;
        updatedData.skate = selectedPackage.includedItems.surfSkate || 0;
        updatedData.analise_de_video_package = selectedPackage.includedItems.videoAnalysis || 0;
        updatedData.massagem_package = selectedPackage.includedItems.massage || 0;
        updatedData.surf_guide_package = selectedPackage.includedItems.surfGuide || 0;
        updatedData.breakfast = selectedPackage.includedItems.breakfast || false;
        updatedData.aluguel_de_prancha = selectedPackage.includedItems.unlimitedBoardRental || false;
        
        console.log('📦 Updated activities from package:', {
          transfer: updatedData.transfer_package,
          surf: updatedData.aulas_de_surf,
          yoga: updatedData.aulas_de_yoga,
          skate: updatedData.skate,
          video: updatedData.analise_de_video_package,
          massage: updatedData.massagem_package,
          guide: updatedData.surf_guide_package,
          breakfast: updatedData.breakfast,
          board: updatedData.aluguel_de_prancha
        });
      }
    }


    setFormData(updatedData);

    // Recalcular preço em tempo real
    if (lead) {
      const updatedLead = { ...lead, ...updatedData };
      console.log('💰 Recalculating price with:', { tipo_de_quarto: updatedLead.tipo_de_quarto });
      const newCalculation = calculateLeadPrice(updatedLead, config);
      console.log('💰 New calculation:', newCalculation);
      setCalculatedLead(newCalculation);
    }
  };


  const handleSave = () => {
    // Remover campos calculados que não existem no banco
    const { calculatedPrice, totalPrice, ...dataToSave } = formData;
    updateMutation.mutate(dataToSave);
  };

  const handleDelete = () => {
    if (!lead) return;
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!lead) return;
    deleteMutation.mutate(lead.id);
    setShowDeleteDialog(false);
  };

  if (!lead) return null;

  // Fallback para garantir que sempre temos opções de status
  const fallbackStatusOptions = [
    { value: "novo", label: "Novos" },
    { value: "dúvidas", label: "Dúvidas" },
    { value: "orçamento enviado", label: "Orçamento Enviado" },
    { value: "fup 1", label: "FUP 1" },
    { value: "link de pagamento enviado", label: "Link de Pagamento Enviado" },
    { value: "pago | a se hospedar", label: "Pago | A se Hospedar" },
    { value: "perdido", label: "Perdido" },
    { value: "hospedagem concluída", label: "Hospedagem Concluída" },
  ];

  const statusOptions = kanbanStatuses.length > 0 
    ? kanbanStatuses.map(status => ({
        value: status.status,
        label: status.title
      }))
    : fallbackStatusOptions;

  console.log('🔍 Kanban statuses in CompleteLeadModal:', kanbanStatuses);
  console.log('🔍 Status options in CompleteLeadModal:', statusOptions);
  console.log('🔍 Current lead status:', lead.status);
  console.log('🔍 Form data status:', formData.status);
  console.log('🔍 Available status values:', statusOptions.map(opt => opt.value));

  // Função para normalizar o status e encontrar a opção correspondente
  const normalizeStatus = (status: string | null | undefined): string => {
    if (!status) return "novo";
    
    // Buscar por correspondência exata primeiro
    const exactMatch = statusOptions.find(opt => opt.value === status);
    if (exactMatch) return status;
    
    // Buscar por correspondência parcial (case insensitive)
    const partialMatch = statusOptions.find(opt => 
      opt.value.toLowerCase().includes(status.toLowerCase()) ||
      status.toLowerCase().includes(opt.value.toLowerCase())
    );
    if (partialMatch) return partialMatch.value;
    
    // Se não encontrar, retornar "novo"
    console.log('⚠️ Status not found in options, using "novo":', status);
    return "novo";
  };

  const normalizedStatus = normalizeStatus(formData.status || lead.status);
  console.log('🔍 Normalized status:', normalizedStatus);

  // Usar as categorias de quarto da configuração para consistência
  const roomTypeOptions = [
    { value: "sem-quarto", label: "Sem quarto" },
    ...config.roomCategories.map(room => ({
      value: room.name, // Usar o nome da configuração
      label: room.name
    }))
  ];

  const surfLevelOptions = [
    { value: "Beginner", label: "Iniciante" },
    { value: "Intermediate", label: "Intermediário" },
    { value: "Advanced", label: "Avançado" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[100vw] h-[100vh] sm:w-[90vw] sm:h-[95vh] max-w-full sm:max-w-6xl max-h-full sm:max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0 m-0 sm:m-4 rounded-none sm:rounded-lg">
        <DialogHeader className="p-4 sm:p-6 pb-3 flex-shrink-0 bg-background border-b">
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <span className="truncate text-base sm:text-lg">
                {isCreating ? "Criar Novo Lead" : `Edição: ${lead.name || "Lead sem nome"}`}
              </span>
            </div>
            {!isCreating && <Badge variant="outline" className="self-start sm:self-auto">{lead.status || "novo"}</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col px-3 sm:px-6 min-h-0">
          <Tabs defaultValue="basic" className="w-full flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-5 gap-0.5 sm:gap-1 h-auto p-1 overflow-x-auto flex-shrink-0 bg-muted mb-2">
              <TabsTrigger value="basic" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm">
                <User className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Básico</span>
                <span className="sm:hidden">Info</span>
              </TabsTrigger>
              <TabsTrigger value="reservation" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Reserva</span>
                <span className="sm:hidden">Data</span>
              </TabsTrigger>
              <TabsTrigger value="accommodation" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm">
                <Home className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Hospedagem</span>
                <span className="sm:hidden">Casa</span>
              </TabsTrigger>
              <TabsTrigger value="activities" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm">
                <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Atividades</span>
                <span className="sm:hidden">Ativ</span>
              </TabsTrigger>
              <TabsTrigger value="cotacao" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm">
                <Receipt className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Cotação</span>
                <span className="sm:hidden">Cot</span>
              </TabsTrigger>
            </TabsList>

          {/* Tab 1: Informações Básicas */}
          <TabsContent value="basic" className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 pb-4 min-h-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-3 sm:space-y-4">
                <h3 className="font-medium text-base sm:text-lg">Dados Pessoais</h3>

                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone || ""}
                    onChange={(e) => handleInputChange("telefone", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="nivel_de_surf">Nível de Surf</Label>
                  <Select
                    value={formData.nivel_de_surf || ""}
                    onValueChange={(value) => handleInputChange("nivel_de_surf", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o nível" />
                    </SelectTrigger>
                    <SelectContent>
                      {surfLevelOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <h3 className="font-medium text-base sm:text-lg">Status e Informações</h3>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={normalizedStatus}
                    onValueChange={(value) => handleInputChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="origem">Origem</Label>
                  <Select
                    value={formData.origem || ""}
                    onValueChange={(value) => handleInputChange("origem", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a origem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Site">Site</SelectItem>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                      <SelectItem value="E-mail">E-mail</SelectItem>
                      <SelectItem value="Tripaneer">Tripaneer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="created_at">Data de Criação</Label>
                  <Input
                    id="created_at"
                    value={formData.created_at ? new Date(formData.created_at).toLocaleString('pt-BR') : ""}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div>
                  <Label htmlFor="notion_page_id">Notion Page ID</Label>
                  <Input
                    id="notion_page_id"
                    value={formData.notion_page_id || ""}
                    onChange={(e) => handleInputChange("notion_page_id", e.target.value)}
                  />
                </div>

              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Reserva */}
          <TabsContent value="reservation" className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 pb-4 min-h-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-3 sm:space-y-4">
                <h3 className="font-medium text-base sm:text-lg">Datas da Reserva</h3>

                <div>
                  <Label htmlFor="check_in_start">Check-in *</Label>
                  <Input
                    id="check_in_start"
                    type="date"
                    value={formData.check_in_start ? (() => {
                      try {
                        // Extrair apenas a parte da data (YYYY-MM-DD) sem conversão de timezone
                        if (formData.check_in_start.includes('T')) {
                          return formData.check_in_start.split('T')[0];
                        }
                        return formData.check_in_start;
                      } catch {
                        return '';
                      }
                    })() : ""}
                    onChange={(e) => {
                      // Salvar apenas a data no formato YYYY-MM-DD (sem timezone)
                      handleInputChange("check_in_start", e.target.value);
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="check_in_end">Check-out *</Label>
                  <Input
                    id="check_in_end"
                    type="date"
                    value={formData.check_in_end ? (() => {
                      try {
                        // Extrair apenas a parte da data (YYYY-MM-DD) sem conversão de timezone
                        if (formData.check_in_end.includes('T')) {
                          return formData.check_in_end.split('T')[0];
                        }
                        return formData.check_in_end;
                      } catch {
                        return '';
                      }
                    })() : ""}
                    onChange={(e) => {
                      // Salvar apenas a data no formato YYYY-MM-DD (sem timezone)
                      handleInputChange("check_in_end", e.target.value);
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="number_of_people">Número de Pessoas *</Label>
                    <Input
                      id="number_of_people"
                      type="number"
                      min="1"
                      step="1"
                      className="w-full"
                      value={formData.number_of_people || 1}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 1 : parseInt(e.target.value) || 1;
                        handleInputChange("number_of_people", value);
                      }}
                      onFocus={(e) => e.target.select()}
                    />
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <h3 className="font-medium text-base sm:text-lg">Pacotes e Configurações</h3>

                <div>
                  <Label htmlFor="pacote">Pacote Selecionado</Label>
                  <Select
                    value={formData.pacote || "none"}
                    onValueChange={(value) => handleInputChange("pacote", value === "none" ? null : value)}
                  >
                    <SelectTrigger id="pacote">
                      <SelectValue placeholder="Selecione um pacote" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem pacote</SelectItem>
                      {config.packages?.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkg.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pacotes incluem serviços pré-configurados
                  </p>
                </div>

                <div>
                  <Label htmlFor="breakfast">Café da Manhã Incluído</Label>
                  <Select
                    value={formData.breakfast ? "sim" : "nao"}
                    onValueChange={(value) => handleInputChange("breakfast", value === "sim")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nao">Não</SelectItem>
                      <SelectItem value="sim">Sim</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Incluir café da manhã na hospedagem
                  </p>
                </div>

                <div>
                  <Label htmlFor="aluguel_de_prancha">Aluguel de Prancha Ilimitado</Label>
                  <Select
                    value={formData.aluguel_de_prancha ? "sim" : "nao"}
                    onValueChange={(value) => handleInputChange("aluguel_de_prancha", value === "sim")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nao">Não</SelectItem>
                      <SelectItem value="sim">Sim</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Incluir aluguel de prancha ilimitado
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 3: Hospedagem */}
          <TabsContent value="accommodation" className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 pb-4 min-h-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-3 sm:space-y-4">
                <h3 className="font-medium text-base sm:text-lg">Tipo de Acomodação</h3>

                <div>
                  <Label htmlFor="room_category">Room category *</Label>
                  <Select
                    value={formData.room_category || ""}
                    onValueChange={(value) => {
                      // Limpar room_type quando mudar a categoria
                      setFormData({
                        ...formData,
                        room_category: value,
                        room_type: "",
                        tipo_de_quarto: value === "Without Room" ? "Without room" : ""
                      });
                      
                      // Recalcular
                      if (lead) {
                        const updatedLead = {
                          ...lead,
                          room_category: value,
                          room_type: "",
                          tipo_de_quarto: value === "Without Room" ? "Without room" : ""
                        };
                        setCalculatedLead(calculateLeadPrice(updatedLead, config));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Select">Select</SelectItem>
                      <SelectItem value="Without Room">Without Room</SelectItem>
                      <SelectItem value="Shared">Shared</SelectItem>
                      <SelectItem value="Private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.room_category && formData.room_category !== "Without Room" && formData.room_category !== "Select" && (
                  <div>
                    <Label htmlFor="room_type">Room type *</Label>
                    <Select
                      value={formData.room_type || ""}
                      onValueChange={(value) => {
                        handleInputChange("room_type", value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Select">Select</SelectItem>
                        {formData.room_category === "Private" && (
                          <>
                            <SelectItem value="Shared bathroom">Shared bathroom</SelectItem>
                            <SelectItem value="Double">Double</SelectItem>
                            <SelectItem value="Sea-View">Sea-View</SelectItem>
                            <SelectItem value="Triple">Triple</SelectItem>
                            <SelectItem value="Family">Family</SelectItem>
                          </>
                        )}
                        {formData.room_category === "Shared" && (
                          <>
                            <SelectItem value="Mixed Economic">Mixed Economic</SelectItem>
                            <SelectItem value="Mixed Standard">Mixed Standard</SelectItem>
                            <SelectItem value="Female Economic">Female Economic</SelectItem>
                            <SelectItem value="Female Standard">Female Standard</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Informações adicionais sobre o quarto selecionado */}
              {formData.room_type && formData.room_type !== "Select" && (
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="font-medium text-base sm:text-lg">Detalhes da Acomodação</h3>
                  <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
                    <div><strong>Categoria:</strong> {formData.room_category}</div>
                    <div><strong>Tipo:</strong> {formData.room_type}</div>
                    {calculatedLead?.calculatedPrice?.accommodationCost > 0 && (
                      <div>
                        <strong>Preço Calculado:</strong>{" "}
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatedLead.calculatedPrice.accommodationCost)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab 4: Atividades e Extras */}
          <TabsContent value="activities" className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 pb-4 min-h-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Atividades de Surf */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="font-medium text-base sm:text-lg">Surf & Esportes</h3>

                <div>
                  <Label htmlFor="aulas_de_surf">Aulas de Surf</Label>
                    <Input
                      id="aulas_de_surf"
                      type="number"
                      min="0"
                      step="1"
                      className="w-full"
                      value={formData.aulas_de_surf || 0}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                        handleInputChange("aulas_de_surf", value);
                      }}
                      onFocus={(e) => e.target.select()}
                    />
                </div>

                <div>
                  <Label htmlFor="skate">Surf-Skate (sessões)</Label>
                    <Input
                      id="skate"
                      type="number"
                      min="0"
                      step="1"
                      className="w-full"
                      value={formData.skate || 0}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                        handleInputChange("skate", value);
                      }}
                      onFocus={(e) => e.target.select()}
                    />
                </div>

                <div>
                  <Label htmlFor="surf_guide_package">Surf Guide (dias)</Label>
                    <Input
                      id="surf_guide_package"
                      type="number"
                      min="0"
                      step="1"
                      className="w-full"
                      value={formData.surf_guide_package || 0}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                        handleInputChange("surf_guide_package", value);
                      }}
                      onFocus={(e) => e.target.select()}
                    />
                </div>
              </div>

              {/* Bem-estar */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="font-medium text-base sm:text-lg">Bem-estar</h3>

                <div>
                  <Label htmlFor="aulas_de_yoga">Aulas de Yoga</Label>
                    <Input
                      id="aulas_de_yoga"
                      type="number"
                      min="0"
                      step="1"
                      className="w-full"
                      value={formData.aulas_de_yoga || 0}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                        handleInputChange("aulas_de_yoga", value);
                      }}
                      onFocus={(e) => e.target.select()}
                    />
                </div>

                <div>
                  <Label htmlFor="massagem_extra">Massagem Extra</Label>
                    <Input
                      id="massagem_extra"
                      type="number"
                      min="0"
                      step="1"
                      className="w-full"
                      value={formData.massagem_extra || 0}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                        handleInputChange("massagem_extra", value);
                      }}
                      onFocus={(e) => e.target.select()}
                    />
                  <p className="text-xs text-muted-foreground mt-1">
                    Massagens adicionais além do pacote
                  </p>
                </div>

                <div>
                  <Label htmlFor="massagem_package">Massagens (Pacote)</Label>
                    <Input
                      id="massagem_package"
                      type="number"
                      min="0"
                      step="1"
                      className="w-full"
                      value={formData.massagem_package || 0}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                        handleInputChange("massagem_package", value);
                      }}
                      onFocus={(e) => e.target.select()}
                    />
                  <p className="text-xs text-muted-foreground mt-1">
                    Massagens incluídas no pacote
                  </p>
                </div>
              </div>

              {/* Serviços Técnicos */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="font-medium text-base sm:text-lg">Serviços Técnicos</h3>

                <div>
                  <Label htmlFor="analise_de_video_extra">Análise de Vídeo Extra</Label>
                    <Input
                      id="analise_de_video_extra"
                      type="number"
                      min="0"
                      step="1"
                      className="w-full"
                      value={formData.analise_de_video_extra || 0}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                        handleInputChange("analise_de_video_extra", value);
                      }}
                      onFocus={(e) => e.target.select()}
                    />
                </div>

                <div>
                  <Label htmlFor="analise_de_video_package">Análise de Vídeo (Pacote)</Label>
                    <Input
                      id="analise_de_video_package"
                      type="number"
                      min="0"
                      step="1"
                      className="w-full"
                      value={formData.analise_de_video_package || 0}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                        handleInputChange("analise_de_video_package", value);
                      }}
                      onFocus={(e) => e.target.select()}
                    />
                </div>

                <div>
                  <Label htmlFor="aluguel_de_prancha">Aluguel de Prancha Ilimitado</Label>
                  <Select
                    value={formData.aluguel_de_prancha ? "sim" : "nao"}
                    onValueChange={(value) => handleInputChange("aluguel_de_prancha", value === "sim")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nao">Não</SelectItem>
                      <SelectItem value="sim">Sim</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Prancha disponível durante toda a estadia
                  </p>
                </div>

                <div>
                  <Label htmlFor="transfer_package">Transfer (Pacote)</Label>
                    <Input
                      id="transfer_package"
                      type="number"
                      min="0"
                      step="1"
                      className="w-full"
                      value={formData.transfer_package || 0}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                        handleInputChange("transfer_package", value);
                      }}
                      onFocus={(e) => e.target.select()}
                    />
                  <p className="text-xs text-muted-foreground mt-1">
                    Transfers incluídos no pacote
                  </p>
                </div>

                <div>
                  <Label htmlFor="transfer_extra">Transfer Extra (quantidade)</Label>
                    <Input
                      id="transfer_extra"
                      type="number"
                      min="0"
                      step="1"
                      className="w-full"
                      value={formData.transfer_extra || 0}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                        handleInputChange("transfer_extra", value);
                      }}
                      onFocus={(e) => e.target.select()}
                    />
                  <p className="text-xs text-muted-foreground mt-1">
                    Transfers adicionais além do pacote
                  </p>
                </div>
              </div>
            </div>

            {/* Itens criados em Configurações → Itens de Cobrança.
                Os campos acima são fixos (cada um tem coluna própria no banco);
                estes vêm da configuração da região e ficam em custom_items. */}
            {customItems.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="font-medium text-base sm:text-lg">Outros Serviços</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {customItems.map((item: any) => (
                      <div key={item.id}>
                        <Label htmlFor={`custom-${item.id}`}>{item.name}</Label>
                        <Input
                          id={`custom-${item.id}`}
                          type="number"
                          min="0"
                          step="1"
                          className="w-full"
                          value={(formData.custom_items || {})[item.id] || 0}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                            handleInputChange("custom_items", {
                              ...(formData.custom_items || {}),
                              [item.id]: value,
                            });
                          }}
                          onFocus={(e) => e.target.select()}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          R$ {item.price} {item.billingType === 'per_person' ? 'por pessoa' : 'por unidade'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Experiências */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="font-medium text-base sm:text-lg">Experiências e Tours</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="hike_extra">Trilha</Label>
                  <Select
                    value={formData.hike_extra ? "sim" : "nao"}
                    onValueChange={(value) => handleInputChange("hike_extra", value === "sim")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nao">Não</SelectItem>
                      <SelectItem value="sim">Sim</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Incluir trilha
                  </p>
                </div>

                <div>
                  <Label htmlFor="rio_city_tour">Rio City Tour</Label>
                  <Select
                    value={formData.rio_city_tour ? "sim" : "nao"}
                    onValueChange={(value) => handleInputChange("rio_city_tour", value === "sim")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nao">Não</SelectItem>
                      <SelectItem value="sim">Sim</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Incluir city tour
                  </p>
                </div>

                <div>
                  <Label htmlFor="carioca_experience_extra">Carioca Experience</Label>
                  <Select
                    value={formData.carioca_experience_extra ? "sim" : "nao"}
                    onValueChange={(value) => handleInputChange("carioca_experience_extra", value === "sim")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nao">Não</SelectItem>
                      <SelectItem value="sim">Sim</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Incluir experiência carioca
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>


          {/* Tab 7: Cotação (read-only, calculada em tempo real do lead atual) */}
          <TabsContent value="cotacao" className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 pb-4 min-h-0">
            {(() => {
              // Mesclar lead + formData garantindo que campos críticos estejam presentes
              // antes de cast para LeadWithCalculation. CotacaoPanel também valida campos
              // obrigatórios internamente (check_in_start/end, number_of_people, etc).
              const mergedLead: Partial<LeadWithCalculation> & {
                check_in_start?: string;
                check_in_end?: string;
              } = { ...lead, ...formData };
              return <CotacaoPanel lead={mergedLead as LeadWithCalculation} />;
            })()}
          </TabsContent>
        </Tabs>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-3 p-3 sm:p-6 border-t bg-background flex-shrink-0">
          {!isCreating && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-2 w-full sm:w-auto text-muted-foreground hover:text-destructive hover:border-destructive/50"
          >
            <Trash2 className="w-3 h-3" />
            {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
          </Button>
          )}
          
          <div className={`flex flex-col sm:flex-row gap-2 ${isCreating ? 'w-full' : ''}`}>
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Save className="w-4 h-4" />
              {updateMutation.isPending ? "Salvando..." : (isCreating ? "Criar Lead" : "Salvar Alterações")}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o lead <strong>{lead?.name || "este lead"}</strong>?
              <br /><br />
              Esta ação não pode ser desfeita. Todos os dados do lead, incluindo histórico de mensagens, serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, Excluir Lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};