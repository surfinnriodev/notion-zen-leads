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
import { DollarSign, Save } from "lucide-react";
import { toast } from "sonner";

interface LeadDetailModalProps {
  lead: LeadWithCalculation | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LeadDetailModal = ({ lead, isOpen, onClose }: LeadDetailModalProps) => {
  const { config } = usePricingConfig();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<LeadWithCalculation>>({});
  const [calculatedLead, setCalculatedLead] = useState<LeadWithCalculation | null>(null);

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
    updateMutation.mutate(formData);
  };

  if (!lead) return null;

  const statusOptions = [
    { value: "novo", label: "Novo" },
    { value: "contato", label: "Em Contato" },
    { value: "proposta", label: "Proposta Enviada" },
    { value: "confirmado", label: "Confirmado" },
    { value: "cancelado", label: "Cancelado" },
  ];

  const roomCategories = config.roomCategories || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detalhes do Lead: {lead.name || "Lead sem nome"}
            <Badge variant="outline">{lead.status || "novo"}</Badge>
          </DialogTitle>
        </DialogHeader>

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
                  value={formData.number_of_people || 1}
                  onChange={(e) => handleInputChange("number_of_people", parseInt(e.target.value) || 1)}
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
                  value={formData.aulas_de_surf || 0}
                  onChange={(e) => handleInputChange("aulas_de_surf", parseInt(e.target.value) || 0)}
                />
              </div>

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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="skate">Surf-Skate</Label>
                <Input
                  id="skate"
                  type="number"
                  min="0"
                  value={formData.skate || 0}
                  onChange={(e) => handleInputChange("skate", parseInt(e.target.value) || 0)}
                />
              </div>

              <div>
                <Label htmlFor="analise_de_video_extra">Análise de Vídeo</Label>
                <Input
                  id="analise_de_video_extra"
                  type="number"
                  min="0"
                  value={formData.analise_de_video_extra || 0}
                  onChange={(e) => handleInputChange("analise_de_video_extra", parseInt(e.target.value) || 0)}
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
                  value={formData.massagem_extra || 0}
                  onChange={(e) => handleInputChange("massagem_extra", parseInt(e.target.value) || 0)}
                />
              </div>

              <div>
                <Label htmlFor="transfer_extra">Transfer</Label>
                <Input
                  id="transfer_extra"
                  type="number"
                  min="0"
                  value={formData.transfer_extra || 0}
                  onChange={(e) => handleInputChange("transfer_extra", parseInt(e.target.value) || 0)}
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
      </DialogContent>
    </Dialog>
  );
};