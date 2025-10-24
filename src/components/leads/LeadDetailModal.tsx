import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LeadWithCalculation, calculateLeadPrice, getLeadDisplayPrice } from "@/types/leads";
import { usePricingConfig } from "@/hooks/usePricingConfig";
import { useMessageTemplates } from "@/hooks/useMessageTemplates";
import { useKanbanStatuses } from "@/hooks/useKanbanStatuses";
import { processTemplate } from "@/utils/messageProcessor";
import { copyToClipboard } from "@/utils/clipboard";
import { selectAllText } from "@/hooks/use-mobile-safari";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Save, MessageCircle, User, Send, Copy } from "lucide-react";
import { toast } from "sonner";

interface LeadDetailModalProps {
  lead: LeadWithCalculation | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LeadDetailModal = ({ lead, isOpen, onClose }: LeadDetailModalProps) => {
  const { config } = usePricingConfig();
  const { templates } = useMessageTemplates();
  const { statuses: kanbanStatuses } = useKanbanStatuses();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<LeadWithCalculation>>({});
  const [calculatedLead, setCalculatedLead] = useState<LeadWithCalculation | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [messageContent, setMessageContent] = useState("");
  const [messageSubject, setMessageSubject] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  // Inicializar formData quando o lead muda
  useEffect(() => {
    if (lead) {
      console.log("🔍 Lead data:", lead);
      console.log("📅 Check-in start:", lead.check_in_start);
      console.log("📅 Check-out:", lead.check_in_end);
      console.log("📞 Telefone:", lead.telefone);
      console.log("🏠 Tipo quarto:", lead.tipo_de_quarto);

      setFormData(lead);
      setCalculatedLead(calculateLeadPrice(lead, config));

      // Reset message states when lead changes
      setSelectedTemplate("");
      setMessageContent("");
      setMessageSubject("");
      setCustomMessage("");
    }
  }, [lead, config]);

  const updateMutation = useMutation({
    mutationFn: async (updatedData: Partial<LeadWithCalculation>) => {
      if (!lead) throw new Error("No lead to update");

      const { data, error } = await supabase
        .from("reservations")
        .update(updatedData)
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
      setCalculatedLead(calculateLeadPrice(updatedLead, config));
    }
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
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
      
      // Construir mensagem com formatação preservada (texto puro, sem encoding)
      const fullMessage = `Assunto: ${cleanSubject}\n\n${cleanContent}`;
      
      // Verificar se estamos no Safari/iOS e usar método específico
      await copyToClipboard(fullMessage);
      toast.success("Mensagem copiada para a área de transferência!");
    } catch (error) {
      console.error("Erro ao copiar mensagem:", error);
      toast.error("Erro ao copiar mensagem. Tente novamente.");
    }
  };

  const handleSendMessage = () => {
    // Aqui futuramente poderia integrar com WhatsApp API ou email
    toast.info("Funcionalidade de envio será implementada em breve!");
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

  console.log('🔍 Kanban statuses in DebugModal:', kanbanStatuses);
  console.log('🔍 Status options:', statusOptions);
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

  const roomCategories = config.roomCategories || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detalhes do Lead: {lead.name || "Lead sem nome"}
            <Badge variant="outline">{lead.status || "novo"}</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Detalhes
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Mensagens
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Informações Básicas</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>

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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
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
            </div>

            {/* Informações da Reserva */}
            <h3 className="font-medium text-lg pt-4">Reserva</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="check_in_start">Check-in</Label>
                <Input
                  id="check_in_start"
                  type="date"
                  value={formData.check_in_start ? formData.check_in_start.split('T')[0] : ""}
                  onChange={(e) => handleInputChange("check_in_start", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="check_in_end">Check-out</Label>
                <Input
                  id="check_in_end"
                  type="date"
                  value={formData.check_in_end ? formData.check_in_end.split('T')[0] : ""}
                  onChange={(e) => handleInputChange("check_in_end", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="number_of_people">Número de Pessoas</Label>
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

              <div>
                <Label htmlFor="tipo_de_quarto">Tipo de Quarto</Label>
                <Select
                  value={formData.tipo_de_quarto || ""}
                  onValueChange={(value) => handleInputChange("tipo_de_quarto", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de quarto" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomCategories.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="pacote">Pacote</Label>
              <Select
                value={formData.pacote || "none"}
                onValueChange={(value) => handleInputChange("pacote", value === "none" ? null : value)}
              >
                <SelectTrigger>
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
            </div>
          </div>

          {/* Extras e Atividades */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Extras e Atividades</h3>

            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="skate">Surf-Skate</Label>
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
                <Label htmlFor="analise_de_video_extra">Análise de Vídeo</Label>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="massagem_extra">Massagem</Label>
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
              </div>

              <div>
                <Label htmlFor="transfer_extra">Transfer</Label>
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
              </div>
            </div>

            {/* Observações */}
            <div>
              <Label htmlFor="obs_do_cliente">Observações do Cliente</Label>
              <Textarea
                id="obs_do_cliente"
                value={formData.obs_do_cliente || ""}
                onChange={(e) => handleInputChange("obs_do_cliente", e.target.value)}
                rows={3}
              />
            </div>

            {/* Preço Calculado */}
            <div className="pt-4">
              <Separator />
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <span className="font-medium">Preço Total:</span>
                </div>
                <span className="text-lg font-semibold text-primary">
                  {calculatedLead ? getLeadDisplayPrice(calculatedLead) : "Calculando..."}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Seleção de Template */}
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Enviar Mensagem</h3>

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
                        rows={10}
                        className="min-h-[200px]"
                      />
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Button
                        onClick={handleCopyMessage}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copiar
                      </Button>
                      <Button
                        onClick={() => selectAllText("messageContent")}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        Selecionar Tudo
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
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Button
                        onClick={async () => {
                          try {
                            await copyToClipboard(customMessage);
                            toast.success("Mensagem copiada!");
                          } catch (error) {
                            console.error("Erro ao copiar:", error);
                            toast.error("Erro ao copiar mensagem.");
                          }
                        }}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copiar
                      </Button>
                      <Button
                        onClick={() => selectAllText("customMessage")}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        Selecionar Tudo
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

              {/* Informações do Lead para Referência */}
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Informações do Lead</h3>
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
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum template disponível</p>
                    <p className="text-xs">Crie templates na seção Mensagens</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};