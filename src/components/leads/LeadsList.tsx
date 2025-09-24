import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Calendar, 
  Mail, 
  Phone, 
  User, 
  MapPin,
  Users
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Lead = Tables<"reservas">;

export const LeadsList = () => {
  const { data: leads, isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservas")
        .select("*")
        .order("property_criado_em", { ascending: false });
      
      if (error) throw error;
      return data as Lead[];
    },
  });

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

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-4">
        {leads?.map((lead) => (
          <Card key={lead.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                         <h3 className="font-medium text-foreground">
                           {lead.property_name || "Nome não informado"}
                         </h3>
                         {lead.property_status && (
                           <Badge className={getStatusColor(lead.property_status)}>
                             {lead.property_status}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                         {lead.property_email && (
                           <div className="flex items-center gap-2">
                             <Mail className="w-4 h-4" />
                             {lead.property_email}
                           </div>
                         )}
                         {lead.property_telefone && (
                           <div className="flex items-center gap-2">
                             <Phone className="w-4 h-4" />
                             {lead.property_telefone}
                           </div>
                         )}
                         {lead.property_number_of_people && (
                           <div className="flex items-center gap-2">
                             <Users className="w-4 h-4" />
                             {lead.property_number_of_people} pessoas
                           </div>
                         )}
                         {lead.property_pacote && (
                           <div className="flex items-center gap-2">
                             <MapPin className="w-4 h-4" />
                             {lead.property_pacote}
                          </div>
                        )}
                      </div>
                      
                       {lead.property_check_in && (
                         <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                           <Calendar className="w-4 h-4" />
                           Check-in disponível
                         </div>
                       )}
                    </div>
                  </div>
                </div>
                
                 <div className="text-xs text-muted-foreground">
                   {lead.property_criado_em ? 
                     format(new Date(lead.property_criado_em), "dd/MM/yyyy HH:mm", { locale: ptBR }) :
                     "Data não disponível"
                   }
                 </div>
              </div>
            </CardContent>
          </Card>
        )) || (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum lead encontrado
          </div>
        )}
      </div>
    </div>
  );
};