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
  Home
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LeadWithCalculation, getLeadDisplayPrice, getLeadCalculationStatus } from "@/types/leads";
import { CompleteLeadModal } from "./CompleteLeadModal";

interface LeadListItemProps {
  lead: LeadWithCalculation;
}

export const LeadListItem = ({ lead }: LeadListItemProps) => {
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
      <Card className="cursor-pointer hover:shadow-sm transition-all duration-200" onClick={() => setIsModalOpen(true)}>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          {/* Mobile Layout */}
          <div className="block sm:hidden">
            <div className="space-y-3">
              {/* Header with name and status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <h3 className="font-medium text-foreground truncate">
                    {lead.name || "Nome não informado"}
                  </h3>
                </div>
                {lead.status && (
                  <Badge className={`${getStatusColor(lead.status)} text-xs flex-shrink-0`}>
                    {lead.status}
                  </Badge>
                )}
              </div>

              {/* Contact info */}
              <div className="space-y-1">
                {lead.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{lead.email}</span>
                  </div>
                )}
                {lead.telefone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-3 h-3 flex-shrink-0" />
                    <span>{lead.telefone}</span>
                  </div>
                )}
              </div>

              {/* Reservation details */}
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {lead.number_of_people && (
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{lead.number_of_people}p</span>
                  </div>
                )}
                {lead.check_in_start && lead.check_in_end && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {format(new Date(lead.check_in_start), "dd/MM", { locale: ptBR })} -
                      {format(new Date(lead.check_in_end), "dd/MM", { locale: ptBR })}
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom row with price and package */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-foreground text-sm">
                    {displayPrice}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(lead.created_at), "dd/MM/yy", { locale: ptBR })}
                </div>
              </div>

              {/* Room type and package on mobile */}
              {(lead.tipo_de_quarto || lead.pacote) && (
                <div className="flex flex-wrap gap-2">
                  {lead.tipo_de_quarto && (
                    <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                      <Home className="w-3 h-3" />
                      <span className="truncate max-w-[120px]">{lead.tipo_de_quarto}</span>
                    </div>
                  )}
                  {lead.pacote && (
                    <div className="text-xs font-medium text-foreground bg-accent px-2 py-1 rounded">
                      {lead.pacote}
                    </div>
                  )}
                </div>
              )}

              {/* Calculation status */}
              {calculationStatus.status !== "complete" && (
                <Badge variant="outline" className="text-xs w-fit">
                  {calculationStatus.message}
                </Badge>
              )}
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between">
            {/* Left section */}
            <div className="flex items-center gap-4 lg:gap-6 flex-1">
              {/* Basic info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-medium text-foreground truncate">
                    {lead.name || "Nome não informado"}
                  </h3>
                  {lead.status && (
                    <Badge className={`${getStatusColor(lead.status)} text-xs`}>
                      {lead.status}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {lead.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      <span className="truncate max-w-[200px]">{lead.email}</span>
                    </div>
                  )}

                  {lead.telefone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      <span>{lead.telefone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Reservation details */}
              <div className="hidden lg:flex items-center gap-6 text-sm text-muted-foreground">
                {lead.number_of_people && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{lead.number_of_people} pessoas</span>
                  </div>
                )}

                {lead.tipo_de_quarto && (
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    <span className="truncate max-w-[120px]">{lead.tipo_de_quarto}</span>
                  </div>
                )}

                {lead.check_in_start && lead.check_in_end && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(new Date(lead.check_in_start), "dd/MM", { locale: ptBR })} -
                      {format(new Date(lead.check_in_end), "dd/MM", { locale: ptBR })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-2 lg:gap-4">
              {/* Package info */}
              {lead.pacote && (
                <div className="hidden lg:block text-xs font-medium text-foreground bg-muted px-2 py-1 rounded">
                  {lead.pacote}
                </div>
              )}

              {/* Price section */}
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-foreground text-sm lg:text-base">
                  {displayPrice}
                </span>
              </div>

              {/* Calculation status */}
              {calculationStatus.status !== "complete" && (
                <Badge variant="outline" className="text-xs hidden lg:inline-flex">
                  {calculationStatus.message}
                </Badge>
              )}

              {/* Created date */}
              <div className="text-xs text-muted-foreground min-w-[60px] lg:min-w-[80px] text-right">
                {format(new Date(lead.created_at), "dd/MM/yy", { locale: ptBR })}
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