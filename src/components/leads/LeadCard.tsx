import { useState } from "react";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Mail, Phone, Users, Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Lead = Tables<"reservas">;

interface LeadCardProps {
  lead: Lead;
}

export const LeadCard = ({ lead }: LeadCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "lead":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "novo":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "contato":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "proposta":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "confirmado":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelado":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
      <DialogTrigger asChild>
        <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-0 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-foreground truncate">
                {lead.property_name || "Nome não informado"}
              </h4>
            </div>
            {lead.property_status && (
              <Badge className={`${getStatusColor(lead.property_status)} text-xs`}>
                {lead.property_status}
              </Badge>
            )}
            
            <div className="space-y-1 text-xs text-muted-foreground">
              {lead.property_email && (
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{lead.property_email}</span>
                </div>
              )}
              
              {lead.property_telefone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3 flex-shrink-0" />
                  <span>{lead.property_telefone}</span>
                </div>
              )}
              
              {lead.property_number_of_people && (
                <div className="flex items-center gap-2">
                  <Users className="w-3 h-3 flex-shrink-0" />
                  <span>{lead.property_number_of_people} pessoas</span>
                </div>
              )}

              {lead.property_check_in && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 flex-shrink-0" />
                  <span>Check-in</span>
                </div>
              )}
            </div>
            
            {lead.property_pacote && (
              <div className="pt-2 border-t border-border">
                <span className="text-xs font-medium text-foreground">
                  {lead.property_pacote}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{lead.property_name || "Lead sem nome"}</span>
            {lead.property_status && (
              <Badge className={getStatusColor(lead.property_status)}>
                {lead.property_status}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Contact Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Informações de Contato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lead.property_email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{lead.property_email}</span>
                </div>
              )}
              {lead.property_telefone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{lead.property_telefone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Reservation Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Detalhes da Reserva</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lead.property_number_of_people && (
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{lead.property_number_of_people} pessoas</span>
                </div>
              )}
              
              {lead.property_pacote && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{lead.property_pacote}</span>
                </div>
              )}

              {lead.property_tipo_de_quarto && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{lead.property_tipo_de_quarto}</span>
                </div>
              )}
            </div>
          </div>

          {/* Services */}
          {(lead.property_aulas_de_surf || lead.property_aulas_de_yoga || lead.property_skate) && (
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Serviços Solicitados</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {lead.property_aulas_de_surf && (
                  <Badge variant="outline">{lead.property_aulas_de_surf} aulas de surf</Badge>
                )}
                {lead.property_aulas_de_yoga && (
                  <Badge variant="outline">{lead.property_aulas_de_yoga} aulas de yoga</Badge>
                )}
                {lead.property_skate && (
                  <Badge variant="outline">{lead.property_skate} skate</Badge>
                )}
              </div>
            </div>
          )}

          {/* Observations */}
          {lead.property_obs_do_cliente && (
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Observações</h3>
              <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                {lead.property_obs_do_cliente}
              </p>
            </div>
          )}

          {/* Summary */}
          {lead.property_resumo_dos_servi_os && (
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Resumo dos Serviços</h3>
              <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                {lead.property_resumo_dos_servi_os}
              </p>
            </div>
          )}

          {/* Dates */}
          {lead.property_criado_em && (
            <div className="text-xs text-muted-foreground pt-4 border-t">
              Criado em: {format(new Date(lead.property_criado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};