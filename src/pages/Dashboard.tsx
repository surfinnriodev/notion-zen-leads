import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Calculator, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const { data: leadsCount } = useQuery({
    queryKey: ["leads-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("reservas")
        .select("*", { count: "exact", head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: statusStats } = useQuery({
    queryKey: ["status-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservas")
        .select("property_status");
      
      if (error) throw error;
      
      const stats = data.reduce((acc, lead) => {
        const status = lead.property_status || "novo";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return stats;
    },
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground mb-2">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Visão geral do sistema de leads
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadsCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Todos os leads cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statusStats?.confirmado || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Reservas confirmadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(statusStats?.contato || 0) + (statusStats?.proposta || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Contato + Propostas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statusStats?.lead || statusStats?.Lead || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Novos leads recebidos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo ao Zen Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Sistema minimalista para gestão de leads inspirado no Notion.
            Use a navegação lateral para acessar os leads ou a calculadora.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;