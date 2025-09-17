import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LeadWithCalculation, calculateLeadPrice, getLeadDisplayPrice } from "@/types/leads";
import { usePricingConfig } from "@/hooks/usePricingConfig";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Save, User, Calendar, Home, Activity, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface CompleteLeadModalProps {
  lead: LeadWithCalculation | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CompleteLeadModal = ({ lead, isOpen, onClose }: CompleteLeadModalProps) => {
  const { config } = usePricingConfig();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<LeadWithCalculation>>({});
  const [calculatedLead, setCalculatedLead] = useState<LeadWithCalculation | null>(null);

  // Inicializar formData quando o lead muda
  useEffect(() => {
    if (lead) {
      console.log("🔍 Complete Lead data:", lead);
      setFormData(lead);
      setCalculatedLead(calculateLeadPrice(lead, config));
    }
  }, [lead, config]);

  const updateMutation = useMutation({
    mutationFn: async (updatedData: Partial<LeadWithCalculation>) => {
      if (!lead) throw new Error("No lead to update");

      const { data, error } = await supabase
        .from("notion_reservas")
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
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);

    // Recalcular preço em tempo real
    if (lead) {
      const updatedLead = { ...lead, ...updatedData };
      setCalculatedLead(calculateLeadPrice(updatedLead, config));
    }
  };


  const handleSave = () => {
    // Remover campos calculados que não existem no banco
    const { calculatedPrice, totalPrice, ...dataToSave } = formData;
    updateMutation.mutate(dataToSave);
  };

  if (!lead) return null;

  const statusOptions = [
    { value: "novo", label: "Novo" },
    { value: "contato", label: "Em Contato" },
    { value: "proposta", label: "Proposta Enviada" },
    { value: "confirmado", label: "Confirmado" },
    { value: "cancelado", label: "Cancelado" },
  ];

  const roomTypeOptions = [
    { value: "Without room", label: "Sem quarto" },
    { value: "Private: Double", label: "Private: Double" },
    { value: "Private: Single", label: "Private: Single" },
    { value: "Private: Shared bathroom", label: "Private: Shared bathroom" },
    { value: "Shared: Mixed Standard", label: "Shared: Mixed Standard" },
    { value: "Shared: Female Only", label: "Shared: Female Only" },
  ];

  const surfLevelOptions = [
    { value: "Beginner", label: "Iniciante" },
    { value: "Intermediate", label: "Intermediário" },
    { value: "Advanced", label: "Avançado" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-6xl h-[95vh] max-h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <span className="truncate">Edição: {lead.name || "Lead sem nome"}</span>
            </div>
            <Badge variant="outline" className="self-start sm:self-auto">{lead.status || "novo"}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col px-6">
          <Tabs defaultValue="basic" className="w-full flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 gap-1 h-auto p-1">
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
                <span className="hidden sm:inline">Comentários</span>
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
          <TabsContent value="basic" className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 pb-4">
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
          <TabsContent value="reservation" className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 pb-4">
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
                    value={formData.number_of_people || 1}
                    onChange={(e) => handleInputChange("number_of_people", parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <h3 className="font-medium text-base sm:text-lg">Pacotes e Configurações</h3>

                <div>
                  <Label htmlFor="pacote">Pacote Selecionado</Label>
                  <Input
                    id="pacote"
                    value={formData.pacote || ""}
                    onChange={(e) => handleInputChange("pacote", e.target.value)}
                    placeholder="Ex: Package 2 - Carioca Ride"
                  />
                </div>

                <div>
                  <Label htmlFor="include_breakfast">Dias com Café da Manhã (Quantidade)</Label>
                  <Input
                    id="include_breakfast"
                    type="number"
                    min="0"
                    value={formData.include_breakfast?.length || 0}
                    onChange={(e) => {
                      const count = parseInt(e.target.value) || 0;
                      const array = count > 0 ? Array(count).fill("dia") : null;
                      handleInputChange("include_breakfast", array);
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Número de dias com café da manhã incluído
                  </p>
                </div>

                <div>
                  <Label htmlFor="aluguel_prancha_ilimitado">Dias com Prancha Ilimitada (Quantidade)</Label>
                  <Input
                    id="aluguel_prancha_ilimitado"
                    type="number"
                    min="0"
                    value={formData.aluguel_prancha_ilimitado?.length || 0}
                    onChange={(e) => {
                      const count = parseInt(e.target.value) || 0;
                      const array = count > 0 ? Array(count).fill("dia") : null;
                      handleInputChange("aluguel_prancha_ilimitado", array);
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Número de dias com prancha ilimitada
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 3: Hospedagem */}
          <TabsContent value="accommodation" className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 pb-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-3 sm:space-y-4">
                <h3 className="font-medium text-base sm:text-lg">Tipo de Acomodação</h3>

                <div>
                  <Label htmlFor="tipo_de_quarto">Tipo de Quarto *</Label>
                  <Select
                    value={formData.tipo_de_quarto || ""}
                    onValueChange={(value) => handleInputChange("tipo_de_quarto", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de quarto" />
                    </SelectTrigger>
                    <SelectContent>
                      {roomTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 4: Atividades e Extras */}
          <TabsContent value="activities" className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 pb-4">
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
                    value={formData.aulas_de_surf || 0}
                    onChange={(e) => handleInputChange("aulas_de_surf", parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="skate">Surf-Skate (sessões)</Label>
                  <Input
                    id="skate"
                    type="number"
                    min="0"
                    value={formData.skate || 0}
                    onChange={(e) => handleInputChange("skate", parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="surf_guide_package">Surf Guide (dias)</Label>
                  <Input
                    id="surf_guide_package"
                    type="number"
                    min="0"
                    value={formData.surf_guide_package || 0}
                    onChange={(e) => handleInputChange("surf_guide_package", parseInt(e.target.value) || 0)}
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
                    value={formData.aulas_de_yoga || 0}
                    onChange={(e) => handleInputChange("aulas_de_yoga", parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="massagem_extra">Massagens Extra</Label>
                  <Input
                    id="massagem_extra"
                    type="number"
                    min="0"
                    value={formData.massagem_extra || 0}
                    onChange={(e) => handleInputChange("massagem_extra", parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="massagem_package">Massagens (Pacote)</Label>
                  <Input
                    id="massagem_package"
                    type="number"
                    min="0"
                    value={formData.massagem_package || 0}
                    onChange={(e) => handleInputChange("massagem_package", parseInt(e.target.value) || 0)}
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
                    value={formData.analise_de_video_extra || 0}
                    onChange={(e) => handleInputChange("analise_de_video_extra", parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="analise_de_video_package">Análise de Vídeo (Pacote)</Label>
                  <Input
                    id="analise_de_video_package"
                    type="number"
                    min="0"
                    value={formData.analise_de_video_package || 0}
                    onChange={(e) => handleInputChange("analise_de_video_package", parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="transfer_extra">Transfer Extra</Label>
                  <Input
                    id="transfer_extra"
                    type="number"
                    min="0"
                    value={formData.transfer_extra || 0}
                    onChange={(e) => handleInputChange("transfer_extra", parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="transfer_package">Transfer (Pacote)</Label>
                  <Input
                    id="transfer_package"
                    type="number"
                    min="0"
                    value={formData.transfer_package || 0}
                    onChange={(e) => handleInputChange("transfer_package", parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Experiências */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="font-medium text-base sm:text-lg">Experiências e Tours</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="hike_extra">Trilhas (Quantidade)</Label>
                  <Input
                    id="hike_extra"
                    type="number"
                    min="0"
                    value={formData.hike_extra || 0}
                    onChange={(e) => handleInputChange("hike_extra", parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Número de trilhas contratadas
                  </p>
                </div>

                <div>
                  <Label htmlFor="rio_city_tour_extra">Rio City Tour (Quantidade)</Label>
                  <Input
                    id="rio_city_tour_extra"
                    type="number"
                    min="0"
                    value={formData.rio_city_tour_extra || 0}
                    onChange={(e) => handleInputChange("rio_city_tour_extra", parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Número de city tours contratados
                  </p>
                </div>

                <div>
                  <Label htmlFor="carioca_experience_extra">Carioca Experience (Quantidade)</Label>
                  <Input
                    id="carioca_experience_extra"
                    type="number"
                    min="0"
                    value={formData.carioca_experience_extra || 0}
                    onChange={(e) => handleInputChange("carioca_experience_extra", parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Número de experiências contratadas
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 5: Comentários */}
          <TabsContent value="comments" className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 pb-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <h3 className="font-medium text-base sm:text-lg">Comentários e Observações</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="obs_do_cliente">Observações do Cliente</Label>
                  <Textarea
                    id="obs_do_cliente"
                    value={formData.obs_do_cliente || ""}
                    onChange={(e) => handleInputChange("obs_do_cliente", e.target.value)}
                    placeholder="Adicione comentários, observações especiais, preferências do cliente..."
                    rows={6}
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
                    rows={4}
                    className="resize-vertical"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Resumo detalhado dos serviços que foram ou serão prestados ao cliente.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 6: Preços */}
          <TabsContent value="pricing" className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 pb-4">
            {/* Resumo Total */}
            <div className="bg-primary/5 p-4 sm:p-6 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  <span className="text-lg sm:text-xl font-semibold">Preço Total:</span>
                </div>
                <span className="text-xl sm:text-2xl font-bold text-primary">
                  {calculatedLead ? getLeadDisplayPrice(calculatedLead) : "Calculando..."}
                </span>
              </div>

              {calculatedLead?.calculatedPrice && (
                <div className="grid grid-cols-2 gap-2 text-sm sm:text-base">
                  <div className="flex justify-between py-1">
                    <span>Noites:</span>
                    <span className="font-medium">{calculatedLead.calculatedPrice.numberOfNights}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Pessoas:</span>
                    <span className="font-medium">{calculatedLead.calculatedPrice.numberOfPeople}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Detalhamento Item por Item */}
            {calculatedLead?.calculatedPrice?.breakdown && (
              <div className="space-y-4">
                {/* Pacote */}
                {calculatedLead.calculatedPrice.breakdown.package && (
                  <div className="bg-card border rounded-lg p-4">
                    <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                      🎯 Pacote
                    </h4>
                    <div className="flex justify-between">
                      <span>{calculatedLead.calculatedPrice.breakdown.package.name}</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatedLead.calculatedPrice.breakdown.package.cost)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Hospedagem */}
                {calculatedLead.calculatedPrice.breakdown.accommodation && (
                  <div className="bg-card border rounded-lg p-4">
                    <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                      🏨 Hospedagem
                    </h4>
                    <div className="flex justify-between">
                      <span>{calculatedLead.calculatedPrice.breakdown.accommodation.description}</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatedLead.calculatedPrice.breakdown.accommodation.cost)}
                      </span>
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

                {/* Resumo Final */}
                <div className="bg-primary/10 border-2 border-primary/20 rounded-lg p-4">
                  <div className="space-y-2">
                    {calculatedLead.calculatedPrice.packageCost > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Subtotal Pacote:</span>
                        <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatedLead.calculatedPrice.packageCost)}</span>
                      </div>
                    )}
                    {calculatedLead.calculatedPrice.accommodationCost > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Subtotal Hospedagem:</span>
                        <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatedLead.calculatedPrice.accommodationCost)}</span>
                      </div>
                    )}
                    {calculatedLead.calculatedPrice.dailyItemsCost > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Subtotal Itens Diários:</span>
                        <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatedLead.calculatedPrice.dailyItemsCost)}</span>
                      </div>
                    )}
                    {calculatedLead.calculatedPrice.fixedItemsCost > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Subtotal Atividades:</span>
                        <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatedLead.calculatedPrice.fixedItemsCost)}</span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Geral:</span>
                      <span className="text-primary">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatedLead.calculatedPrice.totalCost)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t bg-background">
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
      </DialogContent>
    </Dialog>
  );
};