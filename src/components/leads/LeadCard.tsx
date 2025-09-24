import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Mail, 
  Phone, 
  User, 
  Users
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Lead = Tables<"reservas">;

interface LeadCardProps {
  lead: Lead;
}

export const LeadCard = ({ lead }: LeadCardProps) => {
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

  return (
    <Card className="cursor-pointer hover:shadow-sm transition-all duration-200">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <h4 className="font-medium text-sm text-foreground truncate">
              {lead.property_name || "Nome não informado"}
            </h4>
          </div>
          {lead.property_status && (
            <Badge className={`${getStatusColor(lead.property_status)} text-xs`}>
              {lead.property_status}
            </Badge>
          )}
        </div>

        <div className="space-y-2 text-xs text-muted-foreground">
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
  );
};