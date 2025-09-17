import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Mail,
  Phone,
  User,
  Users,
  DollarSign,
  Home,
  MessageSquare
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LeadWithCalculation, getLeadDisplayPrice, getLeadCalculationStatus } from "@/types/leads";
import { CompleteLeadModal } from "./CompleteLeadModal";

interface LeadCardProps {
  lead: LeadWithCalculation;
}

export const LeadCard = ({ lead }: LeadCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "confirmado":
        return "bg-accent text-accent-foreground";
      case "proposta":
        return "bg-zen-blue text-zen-blue-foreground";
      case "cancelado":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const calculationStatus = getLeadCalculationStatus(lead);
  const displayPrice = getLeadDisplayPrice(lead);

  return (
    <>
      <Card className="cursor-pointer hover:shadow-sm transition-all duration-200 w-full" onClick={() => setIsModalOpen(true)}>
        <CardContent className="p-3 sm:p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <h4 className="font-medium text-sm text-foreground truncate">
              {lead.name || "Nome não informado"}
            </h4>
          </div>
          {lead.status && (
            <Badge className={`${getStatusColor(lead.status)} text-xs flex-shrink-0`}>
              {lead.status}
            </Badge>
          )}
        </div>

        <div className="space-y-2 text-xs text-muted-foreground">
          {lead.email && (
            <div className="flex items-center gap-2 min-w-0">
              <Mail className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}

          {lead.telefone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{lead.telefone}</span>
            </div>
          )}

          {lead.number_of_people && (
            <div className="flex items-center gap-2">
              <Users className="w-3 h-3 flex-shrink-0" />
              <span>{lead.number_of_people} pessoas</span>
            </div>
          )}

          {lead.tipo_de_quarto && (
            <div className="flex items-center gap-2 min-w-0">
              <Home className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{lead.tipo_de_quarto}</span>
            </div>
          )}

          {lead.check_in_start && lead.check_in_end && (
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                {format(new Date(lead.check_in_start), "dd/MM", { locale: ptBR })} -
                {format(new Date(lead.check_in_end), "dd/MM", { locale: ptBR })}
              </span>
            </div>
          )}
        </div>

        {lead.pacote && (
          <div className="pt-2 border-t border-border">
            <span className="text-xs font-medium text-foreground block truncate">
              {lead.pacote}
            </span>
          </div>
        )}

        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <DollarSign className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <span className="text-xs font-medium text-foreground truncate">
                {displayPrice}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {lead.obs_do_cliente && (
                <Badge variant="outline" className="text-xs flex-shrink-0 p-1" title="Tem comentários">
                  <MessageSquare className="w-3 h-3" />
                </Badge>
              )}
              {calculationStatus.status !== "complete" && (
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  ⚠️
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <CompleteLeadModal
      lead={lead}
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
    />
    </>
  );
};