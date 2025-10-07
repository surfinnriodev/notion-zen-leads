import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LeadWithCalculation, calculateLeadPrice, getLeadDisplayPrice, mapReservaToLegacyFormat } from "@/types/leads";
import { usePricingConfig } from "@/hooks/usePricingConfig";
import { useMessageTemplates } from "@/hooks/useMessageTemplates";
import { useMessageHistory } from "@/hooks/useMessageHistory";
import { processTemplate } from "@/utils/messageProcessor";
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
import { DollarSign, Save, User, Calendar, Home, Activity, MessageSquare, Send, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CompleteLeadModalProps {
  lead: LeadWithCalculation | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CompleteLeadModal = ({ lead, isOpen, onClose }: CompleteLeadModalProps) => {
  const { config } = usePricingConfig();
  const { templates } = useMessageTemplates();
  const { addMessage } = useMessageHistory();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<LeadWithCalculation>>({});
  const [calculatedLead, setCalculatedLead] = useState<LeadWithCalculation | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [messageContent, setMessageContent] = useState("");
  const [messageSubject, setMessageSubject] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Inicializar formData quando o lead muda
  useEffect(() => {
    if (lead) {
      // Mapear para o formato legado para compatibilidade
      const legacyLead = mapReservaToLegacyFormat(lead);
      
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
      
      // Incluir os novos campos de ajuste de preço
      legacyLead.accommodation_price_override = lead.accommodation_price_override;
      legacyLead.extra_fee_amount = lead.extra_fee_amount;
      legacyLead.extra_fee_description = lead.extra_fee_description;
      
      setFormData(legacyLead);
      setCalculatedLead(calculateLeadPrice(lead, config));

      // Reset message states when lead changes
      setSelectedTemplate("");
      setMessageContent("");
      setMessageSubject("");
      setCustomMessage("");
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
      if (updatedData.pacote !== undefined) mappedData.pacote = updatedData.pacote;
      if (updatedData.obs_do_cliente !== undefined) mappedData.obs_do_cliente = updatedData.obs_do_cliente;
      if (updatedData.resumo_dos_servicos !== undefined) mappedData.resumo_dos_servicos = updatedData.resumo_dos_servicos;
      if (updatedData.nivel_de_surf !== undefined) mappedData.nivel_de_surf = updatedData.nivel_de_surf;
      if (updatedData.notion_page_id !== undefined) mappedData.notion_page_id = updatedData.notion_page_id;

      // Atividades - mapear para os campos corretos da tabela reservations
      if (updatedData.aulas_de_surf !== undefined) mappedData.aulas_de_surf = updatedData.aulas_de_surf;
      if (updatedData.aulas_de_yoga !== undefined) mappedData.aulas_de_yoga = updatedData.aulas_de_yoga;
      if (updatedData.skate !== undefined) mappedData.skate = updatedData.skate;
      if (updatedData.analise_de_video_extra !== undefined) mappedData.analise_de_video = updatedData.analise_de_video_extra;
      if (updatedData.analise_de_video_package !== undefined) mappedData.analise_de_video_package = updatedData.analise_de_video_package;
      if (updatedData.massagem_extra !== undefined) mappedData.massagem_extra = Boolean(updatedData.massagem_extra);
      if (updatedData.massagem_package !== undefined) mappedData.massagem_package = updatedData.massagem_package;
      if (updatedData.surf_guide_package !== undefined) mappedData.surf_guide_package = updatedData.surf_guide_package;
      if (updatedData.transfer_extra !== undefined) mappedData.transfer_extra = Boolean(updatedData.transfer_extra);
      if (updatedData.transfer_package !== undefined) mappedData.transfer_package = updatedData.transfer_package;

      // Booleans fields - mapping to correct database field names
      if (updatedData.include_breakfast !== undefined) mappedData.breakfast = Boolean(updatedData.include_breakfast);
      if (updatedData.aluguel_prancha_ilimitado !== undefined) mappedData.aluguel_de_prancha = Boolean(updatedData.aluguel_prancha_ilimitado);
      if (updatedData.hike_extra !== undefined) mappedData.hike_extra = Boolean(updatedData.hike_extra);
      if (updatedData.rio_city_tour_extra !== undefined) mappedData.rio_city_tour = Boolean(updatedData.rio_city_tour_extra);
      if (updatedData.carioca_experience_extra !== undefined) mappedData.carioca_experience = Boolean(updatedData.carioca_experience_extra);

      // Datas - usar campos diretos ao invés de JSON
      if (updatedData.check_in_start !== undefined) mappedData.check_in_start = updatedData.check_in_start;
      if (updatedData.check_in_end !== undefined) mappedData.check_in_end = updatedData.check_in_end;

      // Novos campos de categoria de quarto e ajustes de preço
      if (updatedData.room_category !== undefined) mappedData.room_category = updatedData.room_category;
      if (updatedData.room_type !== undefined) mappedData.room_type = updatedData.room_type;
      if (updatedData.accommodation_price_override !== undefined) mappedData.accommodation_price_override = updatedData.accommodation_price_override;
      if (updatedData.extra_fee_amount !== undefined) mappedData.extra_fee_amount = updatedData.extra_fee_amount;
      if (updatedData.extra_fee_description !== undefined) mappedData.extra_fee_description = updatedData.extra_fee_description;

      const { data, error } = await supabase
        .from("reservations")
        .update(mappedData)
        .eq("id", lead.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads-board"] });
      toast.success("Lead atualizado com sucesso!");
      onClose();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar lead: " + error.message);
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

    // Atualizar transfer_package automaticamente quando o pacote muda
    if (field === 'pacote') {
      const selectedPackage = config.packages?.find(pkg => 
        pkg.id === value || pkg.name === value
      );
      updatedData.transfer_package = selectedPackage?.includedItems?.transfer || 0;
      console.log('✈️ Updated transfer_package from package:', updatedData.transfer_package);
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

  const handleTemplateSelect = (templateId: string) => {
    console.log("🎯 Template selected:", templateId);
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    console.log("📝 Found template:", template);
    if (template && calculatedLead) {
      console.log("🔄 Processing template with lead:", calculatedLead);
      const processed = processTemplate(template, calculatedLead, config);
      console.log("✅ Processed message:", processed);
      setMessageSubject(processed.subject);
      setMessageContent(processed.content);
    }
  };

  const handleCopyMessage = async () => {
    try {
      // Limpar e formatar a mensagem corretamente
      const cleanSubject = messageSubject.trim();
      const cleanContent = messageContent.trim();
      
      // Construir mensagem com formatação preservada
      const fullMessage = `Assunto: ${cleanSubject}\n\n${cleanContent}`;
      
      // Copiar usando a API moderna de clipboard
      await navigator.clipboard.writeText(fullMessage);
      toast.success("Mensagem copiada para a área de transferência!");
    } catch (error) {
      console.error("Erro ao copiar mensagem:", error);
      toast.error("Erro ao copiar mensagem. Tente novamente.");
    }
  };

  const handleSendMessage = () => {
    if (!lead) return;

    // Registrar mensagem no histórico
    const messageData = {
      lead_id: lead.id,
      template_id: selectedTemplate || null,
      subject: messageSubject || customMessage.split('\n')[0] || 'Mensagem personalizada',
      content: messageContent || customMessage,
      message_type: selectedTemplate ? 'template' : 'custom',
      sent_via: 'manual',
    };

    addMessage(messageData);

    // Limpar campos
    setSelectedTemplate("");
    setMessageContent("");
    setMessageSubject("");
    setCustomMessage("");

    toast.success("Mensagem registrada no histórico!");
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

  const statusOptions = [
    { value: "novo", label: "Novo" },
    { value: "contato", label: "Em Contato" },
    { value: "proposta", label: "Proposta Enviada" },
    { value: "confirmado", label: "Confirmado" },
    { value: "cancelado", label: "Cancelado" },
  ];

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
              <span className="truncate text-base sm:text-lg">Edição: {lead.name || "Lead sem nome"}</span>
            </div>
            <Badge variant="outline" className="self-start sm:self-auto">{lead.status || "novo"}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col px-3 sm:px-6 min-h-0">
          <Tabs defaultValue="basic" className="w-full flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-4 sm:grid-cols-7 gap-0.5 sm:gap-1 h-auto p-1 overflow-x-auto flex-shrink-0 bg-muted mb-2">
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
              <TabsTrigger value="comments" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm relative">
                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Mensagens</span>
                <span className="sm:hidden">Msg</span>
                {formData.obs_do_cliente && (
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </TabsTrigger>
              <TabsTrigger value="pricing" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm">
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Preços</span>
                <span className="sm:hidden">$</span>
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
                    value={formData.status || "novo"}
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
                    value={formData.check_in_start ? formData.check_in_start.split('T')[0] : ""}
                    onChange={(e) => handleInputChange("check_in_start", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="check_in_end">Check-out *</Label>
                  <Input
                    id="check_in_end"
                    type="date"
                    value={formData.check_in_end ? formData.check_in_end.split('T')[0] : ""}
                    onChange={(e) => handleInputChange("check_in_end", e.target.value)}
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
                  <Label htmlFor="include_breakfast">Café da Manhã Incluído</Label>
                  <Select
                    value={formData.include_breakfast ? "sim" : "nao"}
                    onValueChange={(value) => handleInputChange("include_breakfast", value === "sim")}
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
                  <Label htmlFor="aluguel_prancha_ilimitado">Aluguel de Prancha Ilimitado</Label>
                  <Select
                    value={formData.aluguel_prancha_ilimitado ? "sim" : "nao"}
                    onValueChange={(value) => handleInputChange("aluguel_prancha_ilimitado", value === "sim")}
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
                  <p className="text-xs text-muted-foreground">
                    O preço final pode ser ajustado na aba "Preços" se necessário.
                  </p>
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
                  <Select
                    value={formData.massagem_extra ? "sim" : "nao"}
                    onValueChange={(value) => handleInputChange("massagem_extra", value === "sim")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nao">Não</SelectItem>
                      <SelectItem value="sim">Sim</SelectItem>
                    </SelectContent>
                  </Select>
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
                      className="w-full bg-muted"
                      value={(() => {
                        // Buscar transfer incluído no pacote selecionado
                        if (formData.pacote) {
                          const selectedPackage = config.packages?.find(pkg => 
                            pkg.id === formData.pacote || pkg.name === formData.pacote
                          );
                          return selectedPackage?.includedItems?.transfer || 0;
                        }
                        return 0;
                      })()}
                      disabled
                      readOnly
                    />
                  <p className="text-xs text-muted-foreground mt-1">
                    Transfer incluído no pacote (read-only)
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
                  <Label htmlFor="rio_city_tour_extra">Rio City Tour</Label>
                  <Select
                    value={formData.rio_city_tour_extra ? "sim" : "nao"}
                    onValueChange={(value) => handleInputChange("rio_city_tour_extra", value === "sim")}
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

          {/* Tab 5: Mensagens */}
          <TabsContent value="comments" className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 pb-4 min-h-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sistema de Mensagens */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <h3 className="font-medium text-base sm:text-lg">Enviar Mensagem</h3>
                </div>

                <div>
                  <Label htmlFor="template">Escolher Template</Label>
                  <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um template ou escreva sua própria mensagem" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTemplate && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="messageSubject">Assunto</Label>
                      <Input
                        id="messageSubject"
                        value={messageSubject}
                        onChange={(e) => setMessageSubject(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="messageContent">Mensagem</Label>
                      <Textarea
                        id="messageContent"
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        rows={8}
                        className="min-h-[200px]"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleCopyMessage}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copiar
                      </Button>
                      <Button
                        onClick={handleSendMessage}
                        className="flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Enviar
                      </Button>
                    </div>
                  </div>
                )}

                <Separator />

                <div>
                  <Label htmlFor="customMessage">Ou escreva uma mensagem personalizada</Label>
                  <Textarea
                    id="customMessage"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Digite sua mensagem aqui..."
                    rows={6}
                  />
                  {customMessage && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(customMessage);
                          toast.success("Mensagem copiada!");
                        }}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copiar
                      </Button>
                      <Button
                        onClick={handleSendMessage}
                        className="flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Enviar
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Informações do Lead e Observações */}
              <div className="space-y-4">
                <h3 className="font-medium text-base sm:text-lg">Informações do Lead</h3>
                <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
                  <div><strong>Nome:</strong> {lead.name || "N/A"}</div>
                  <div><strong>Email:</strong> {lead.email || "N/A"}</div>
                  <div><strong>Telefone:</strong> {lead.telefone || "N/A"}</div>
                  <div><strong>Check-in:</strong> {lead.check_in_start ? new Date(lead.check_in_start).toLocaleDateString('pt-BR') : "N/A"}</div>
                  <div><strong>Check-out:</strong> {lead.check_in_end ? new Date(lead.check_in_end).toLocaleDateString('pt-BR') : "N/A"}</div>
                  <div><strong>Pessoas:</strong> {lead.number_of_people || 0}</div>
                  <div><strong>Quarto:</strong> {lead.tipo_de_quarto || "N/A"}</div>
                  <div><strong>Pacote:</strong> {lead.pacote || "Sem pacote"}</div>
                  <div><strong>Preço Total:</strong> {calculatedLead ? getLeadDisplayPrice(calculatedLead) : "Calculando..."}</div>
                </div>

                {templates.length === 0 && (
                  <div className="p-4 border rounded-lg text-center text-muted-foreground">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum template disponível</p>
                    <p className="text-xs">Crie templates na seção Mensagens</p>
                  </div>
                )}

                <Separator />

                {/* Observações do Cliente */}
                <div className="space-y-4">
                  <h3 className="font-medium text-base sm:text-lg">Observações do Cliente</h3>
                  <div>
                    <Label htmlFor="obs_do_cliente">Observações</Label>
                    <Textarea
                      id="obs_do_cliente"
                      value={formData.obs_do_cliente || ""}
                      onChange={(e) => handleInputChange("obs_do_cliente", e.target.value)}
                      placeholder="Adicione comentários, observações especiais, preferências do cliente..."
                      rows={4}
                      className="resize-vertical"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use este espaço para registrar informações importantes sobre o cliente, pedidos especiais, restrições alimentares, etc.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="resumo_dos_servicos">Resumo dos Serviços</Label>
                    <Textarea
                      id="resumo_dos_servicos"
                      value={formData.resumo_dos_servicos || ""}
                      onChange={(e) => handleInputChange("resumo_dos_servicos", e.target.value)}
                      placeholder="Descreva o resumo dos serviços contratados..."
                      rows={3}
                      className="resize-vertical"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Resumo detalhado dos serviços que foram ou serão prestados ao cliente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 6: Preços */}
          <TabsContent value="pricing" className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 pb-4 min-h-0">
            {/* Detalhamento Item por Item */}
            {calculatedLead?.calculatedPrice?.breakdown && (
              <div className="space-y-4">
                {/* Pacote */}
                {calculatedLead.calculatedPrice.breakdown.package && (
                  <div className="bg-card border rounded-lg p-4">
                    <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                      📦 Pacote
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="font-medium">{calculatedLead.calculatedPrice.breakdown.package.name}</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatedLead.calculatedPrice.breakdown.package.cost)}
                        </span>
                      </div>
                      
                      {/* Benefícios do Pacote */}
                      {(() => {
                        const selectedPackage = config.packages?.find(pkg => pkg.id === lead?.pacote || pkg.name === lead?.pacote);
                        if (selectedPackage) {
                          const benefits = [];
                          const nights = calculatedLead.calculatedPrice.numberOfNights;
                          
                          benefits.push(`${nights} noites & ${nights + 1} dias`);
                          
                          if (selectedPackage.includedItems.surfLessons) {
                            benefits.push(`${selectedPackage.includedItems.surfLessons} Aula${selectedPackage.includedItems.surfLessons > 1 ? 's' : ''} de Surf`);
                          }
                          if (selectedPackage.includedItems.yogaLessons) {
                            benefits.push(`${selectedPackage.includedItems.yogaLessons} Aula${selectedPackage.includedItems.yogaLessons > 1 ? 's' : ''} de Yoga`);
                          }
                          if (selectedPackage.includedItems.surfSkate) {
                            benefits.push(`${selectedPackage.includedItems.surfSkate} Aula${selectedPackage.includedItems.surfSkate > 1 ? 's' : ''} de Surf Skate`);
                          }
                          if (selectedPackage.includedItems.videoAnalysis) {
                            benefits.push(`Análise de Vídeo`);
                          }
                          if (selectedPackage.includedItems.massage) {
                            benefits.push(`Massagem Ayurvédica`);
                          }
                          if (selectedPackage.includedItems.surfGuide) {
                            benefits.push(`${selectedPackage.includedItems.surfGuide} Surf Guide`);
                          }
                          if (selectedPackage.includedItems.unlimitedBoardRental) {
                            benefits.push(`Aluguel de Prancha (Opcional)`);
                          }
                          if (selectedPackage.includedItems.breakfast) {
                            benefits.push(`Café da Manhã (Opcional)`);
                          }
                          if (selectedPackage.includedItems.transfer) {
                            benefits.push(`Transfer Aeroporto (Opcional)`);
                          }
                          
                          return (
                            <div className="bg-primary/5 p-3 rounded-lg">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Benefícios incluídos:</p>
                              <ul className="space-y-1 text-xs text-muted-foreground">
                                {benefits.map((benefit, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="text-primary mt-0.5">•</span>
                                    <span>{benefit}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                )}

                {/* Hospedagem */}
                {lead?.tipo_de_quarto && lead.tipo_de_quarto !== "Without room" && (
                  <div className="bg-card border rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold text-base flex items-center gap-2">
                      🏨 Hospedagem
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium">
                            {(() => {
                              // Se já tem o formato completo "Category: Type"
                              if (lead.tipo_de_quarto.includes(':')) {
                                return lead.tipo_de_quarto;
                              }
                              
                              // Se tem room_category e room_type separados
                              if (formData.room_category && formData.room_type) {
                                return `${formData.room_category}: ${formData.room_type}`;
                              }
                              
                              // Buscar na configuração de quartos
                              const room = config.roomCategories?.find(r => 
                                r.id === lead.tipo_de_quarto || r.name === lead.tipo_de_quarto
                              );
                              
                              if (room) {
                                return room.name;
                              }
                              
                              // Fallback: mostrar o que está salvo
                              return lead.tipo_de_quarto;
                            })()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {calculatedLead?.calculatedPrice?.numberOfNights || 0} noites • {calculatedLead?.calculatedPrice?.numberOfPeople || 0} pessoas
                          </span>
                        </div>
                        {formData.accommodation_price_override && (
                          <span className="font-medium text-primary">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.accommodation_price_override)}
                          </span>
                        )}
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="accommodation_price_override" className="text-sm font-semibold">
                            💵 Valor da Hospedagem
                          </Label>
                          <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                            Inserção Manual
                          </span>
                        </div>
                        <div className="flex gap-2 items-center">
                          <span className="text-xs text-muted-foreground">R$</span>
                          <Input
                            id="accommodation_price_override"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.accommodation_price_override || ""}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseFloat(e.target.value);
                              handleInputChange("accommodation_price_override", value);
                            }}
                            onFocus={(e) => e.target.select()}
                            className="flex-1"
                          />
                          {formData.accommodation_price_override && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleInputChange("accommodation_price_override", null)}
                            >
                              Limpar
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formData.accommodation_price_override 
                            ? `✓ Valor definido: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.accommodation_price_override)}`
                            : "Digite o valor total da hospedagem para este lead"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Itens Diários */}
                {calculatedLead.calculatedPrice.breakdown.dailyItems && calculatedLead.calculatedPrice.breakdown.dailyItems.length > 0 && (
                  <div className="bg-card border rounded-lg p-4">
                    <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                      📅 Itens Diários
                    </h4>
                    <div className="space-y-2">
                      {calculatedLead.calculatedPrice.breakdown.dailyItems.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex-1">
                            <span className="text-sm">{item.name}</span>
                            <span className="text-xs text-muted-foreground block">
                              {item.quantity}x {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice)}
                            </span>
                          </div>
                          <span className="font-medium">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.cost)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Itens Fixos / Atividades */}
                {calculatedLead.calculatedPrice.breakdown.fixedItems && calculatedLead.calculatedPrice.breakdown.fixedItems.length > 0 && (
                  <div className="bg-card border rounded-lg p-4">
                    <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                      🏄‍♂️ Atividades & Extras
                    </h4>
                    <div className="space-y-2">
                      {calculatedLead.calculatedPrice.breakdown.fixedItems.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex-1">
                            <span className="text-sm">{item.name}</span>
                            <span className="text-xs text-muted-foreground block">
                              {item.quantity}x {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice)}
                            </span>
                          </div>
                          <span className="font-medium">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.cost)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Taxa Extra */}
                <div className="bg-card border rounded-lg p-4 space-y-4">
                  <h4 className="font-semibold text-base flex items-center gap-2">
                    💰 Taxa Extra
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="extra_fee_description" className="text-sm">
                        Descrição da Taxa
                      </Label>
                      <Input
                        id="extra_fee_description"
                        type="text"
                        placeholder="Ex: Taxa de limpeza, Taxa de serviço..."
                        value={formData.extra_fee_description || ""}
                        onChange={(e) => handleInputChange("extra_fee_description", e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="extra_fee_amount" className="text-sm">
                        Valor da Taxa
                      </Label>
                      <div className="flex gap-2 items-center">
                        <span className="text-xs text-muted-foreground">R$</span>
                        <Input
                          id="extra_fee_amount"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.extra_fee_amount || ""}
                          onChange={(e) => {
                            const value = e.target.value === '' ? null : parseFloat(e.target.value);
                            handleInputChange("extra_fee_amount", value);
                          }}
                          onFocus={(e) => e.target.select()}
                          className="flex-1"
                        />
                        {formData.extra_fee_amount && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              handleInputChange("extra_fee_amount", null);
                              handleInputChange("extra_fee_description", "");
                            }}
                          >
                            Limpar
                          </Button>
                        )}
                      </div>
                      {formData.extra_fee_amount && formData.extra_fee_amount > 0 && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Taxa de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.extra_fee_amount)} será adicionada ao total
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Resumo do Orçamento - Movido para o final */}
            {calculatedLead?.calculatedPrice && (
              <div className="bg-white border-2 border-primary/20 rounded-lg shadow-sm">
                {/* Cabeçalho */}
                <div className="bg-primary/10 p-4 border-b border-primary/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-primary" />
                      <span className="text-base font-semibold">Resumo do Orçamento</span>
                    </div>
                    <Badge variant="outline" className="bg-white">
                      {calculatedLead.calculatedPrice.numberOfNights || 0} noites • {calculatedLead.calculatedPrice.numberOfPeople || 0} pessoas
                    </Badge>
                  </div>
                </div>

                {/* Cálculos */}
                {(() => {
                  // Calcular valores
                  const servicosCost = (calculatedLead.calculatedPrice.packageCost || 0) + 
                                      (calculatedLead.calculatedPrice.fixedItemsCost || 0);
                  
                  const taxaCost = formData.extra_fee_amount || 0;
                  
                  const hospedagemCost = formData.accommodation_price_override || 
                                        calculatedLead.calculatedPrice.accommodationCost || 0;
                  
                  // Usar APENAS o custo do café da manhã (não incluir prancha)
                  const cafeCost = (calculatedLead.calculatedPrice as any).breakfastOnlyCost || 0;
                  
                  const valorDeposito = servicosCost + taxaCost;
                  const valorPendente = hospedagemCost + cafeCost;
                  const total = valorDeposito + valorPendente;

                  return (
                    <div className="p-4 space-y-4">
                      {/* Taxa */}
                      {taxaCost > 0 && (
                        <div className="flex justify-between items-center py-2 border-b border-dashed">
                          <span className="text-sm font-medium">Taxa (BRL):</span>
                          <span className="font-medium text-orange-600">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(taxaCost)}
                          </span>
                        </div>
                      )}

                      {/* Valor Depósito */}
                      <div className="bg-blue-50 p-3 rounded-lg space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-blue-900">💵 Valor Depósito:</span>
                          <span className="font-bold text-blue-900">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorDeposito)}
                          </span>
                        </div>
                        {/* Desmembramento do Depósito */}
                        <div className="text-xs text-blue-800 pl-4 space-y-1 border-l-2 border-blue-200">
                          {calculatedLead.calculatedPrice.packageCost > 0 && (
                            <div className="flex justify-between">
                              <span>• Pacote:</span>
                              <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatedLead.calculatedPrice.packageCost)}</span>
                            </div>
                          )}
                          {calculatedLead.calculatedPrice.fixedItemsCost > 0 && (
                            <div className="flex justify-between">
                              <span>• Atividades:</span>
                              <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatedLead.calculatedPrice.fixedItemsCost)}</span>
                            </div>
                          )}
                          {taxaCost > 0 && (
                            <div className="flex justify-between">
                              <span>• Taxa:</span>
                              <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(taxaCost)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Valor Pendente */}
                      <div className="bg-amber-50 p-3 rounded-lg space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-amber-900">⏳ Valor Pendente:</span>
                          <span className="font-bold text-amber-900">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorPendente)}
                          </span>
                        </div>
                        {/* Desmembramento do Pendente */}
                        <div className="text-xs text-amber-800 pl-4 space-y-1 border-l-2 border-amber-200">
                          {hospedagemCost > 0 && (
                            <div className="flex justify-between">
                              <span>• Hospedagem:</span>
                              <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(hospedagemCost)}</span>
                            </div>
                          )}
                          {cafeCost > 0 && (
                            <div className="flex justify-between">
                              <span>• Café da Manhã:</span>
                              <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cafeCost)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Total */}
                      <div className="bg-primary/5 p-4 rounded-lg border-t-2 border-primary/30">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold">Total:</span>
                          <span className="text-2xl font-bold text-primary">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 text-right">
                          Depósito + Pendente
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </TabsContent>
        </Tabs>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-3 p-3 sm:p-6 border-t bg-background flex-shrink-0">
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
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Save className="w-4 h-4" />
              {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
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