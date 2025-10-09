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
      <Card className="cursor-pointer hover:shadow-md hover:shadow-black/5 transition-all duration-200 w-full border border-border hover:border-border-hover bg-card active:scale-[0.98]" onClick={() => setIsModalOpen(true)}>
        <CardContent className="p-3 sm:p-3 space-y-2 sm:space-y-3 overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <h4 className="font-medium text-sm sm:text-sm text-foreground truncate">
              {lead.name || "Nome não informado"}
            </h4>
          </div>
          {lead.status && (
            <Badge className={`${getStatusColor(lead.status)} text-[10px] sm:text-xs flex-shrink-0 px-1.5 sm:px-2`}>
              {lead.status}
            </Badge>
          )}
        </div>

        <div className="space-y-1.5 sm:space-y-2 text-xs text-muted-foreground overflow-hidden">
          {/* Mobile: Priorizar informações mais importantes */}
          {(lead.check_in_start || lead.check_in_end) && (
            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span className="truncate max-w-full text-[11px] sm:text-xs font-medium">
                {(() => {
                  try {
                    if (lead.check_in_start) {
                      // Extrair apenas a parte da data (YYYY-MM-DD) sem conversão de timezone
                      const startDateStr = lead.check_in_start.includes('T') 
                        ? lead.check_in_start.split('T')[0] 
                        : lead.check_in_start;
                      const [year, month, day] = startDateStr.split('-');
                      const startDate = `${day}/${month}`;
                      
                      let endDate = startDate;
                      if (lead.check_in_end) {
                        const endDateStr = lead.check_in_end.includes('T') 
                          ? lead.check_in_end.split('T')[0] 
                          : lead.check_in_end;
                        const [endYear, endMonth, endDay] = endDateStr.split('-');
                        endDate = `${endDay}/${endMonth}`;
                      }
                      
                      return `${startDate} - ${endDate}`;
                    }
                  } catch (e) {
                    return "Datas inválidas";
                  }
                  return "Sem data";
                })()}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            {lead.number_of_people && (
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 flex-shrink-0" />
                <span className="text-[11px] sm:text-xs">{lead.number_of_people}p</span>
              </div>
            )}

            {lead.tipo_de_quarto && (
              <div className="flex items-center gap-1 min-w-0 overflow-hidden flex-1">
                <Home className="w-3 h-3 flex-shrink-0" />
                <span className="truncate max-w-full text-[11px] sm:text-xs">{lead.tipo_de_quarto}</span>
              </div>
            )}
          </div>

          {/* Contato - Compacto no mobile */}
          <div className="hidden sm:block space-y-1.5">
            {lead.email && (
              <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span className="truncate max-w-full">{lead.email}</span>
              </div>
            )}

            {lead.telefone && (
              <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                <Phone className="w-3 h-3 flex-shrink-0" />
                <span className="truncate max-w-full">{lead.telefone}</span>
              </div>
            )}
          </div>
        </div>

        {lead.pacote && (
          <div className="pt-1.5 sm:pt-2 border-t border-border overflow-hidden">
            <span className="text-[10px] sm:text-xs font-medium text-primary block truncate max-w-full">
              📦 {lead.pacote}
            </span>
          </div>
        )}

        <div className="pt-1.5 sm:pt-2 border-t border-border overflow-hidden">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0 overflow-hidden flex-1">
              <DollarSign className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm sm:text-xs font-bold text-primary truncate max-w-full">
                {displayPrice}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {lead.obs_do_cliente && (
                <Badge variant="outline" className="text-[10px] sm:text-xs flex-shrink-0 p-1" title="Tem comentários">
                  <MessageSquare className="w-3 h-3" />
                </Badge>
              )}
              {calculationStatus.status !== "complete" && (
                <Badge variant="outline" className="text-[10px] sm:text-xs flex-shrink-0 px-1">
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