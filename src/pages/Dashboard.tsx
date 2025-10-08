import { useDashboardData } from "@/hooks/useDashboardData";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SimpleChart } from "@/components/dashboard/SimpleChart";
import { Users, DollarSign, TrendingUp, Calendar, Target, Clock, MapPin } from "lucide-react";

const Dashboard = () => {
  const { data: metrics, isLoading, error } = useDashboardData();

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Carregando métricas...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Erro ao carregar dados do dashboard</div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  // Preparar dados para gráficos
  const statusData = Object.entries(metrics.leadsByStatus).map(([status, data]) => ({
    label: status,
    value: data.count,
    color: getStatusColor(status)
  }));

  const revenueData = metrics.revenueByMonth.map(item => ({
    label: item.month,
    value: item.revenue
  }));

  const topPackagesData = metrics.topPackages.slice(0, 5).map((pkg, index) => ({
    label: pkg.package,
    value: pkg.revenue,
    color: `hsl(${index * 72}, 70%, 50%)`
  }));

  const conversionData = metrics.conversionFunnel.map(item => ({
    label: item.status,
    value: item.count
  }));

  const roomTypeData = Object.entries(metrics.roomTypeDistribution).map(([type, count]) => ({
    label: type,
    value: count
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">
          Dashboard
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Visão geral das métricas de leads e receita
        </p>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Total de Leads"
          value={metrics.totalLeads}
          icon={Users}
          subtitle="leads cadastrados"
        />

        <MetricCard
          title="Receita Confirmada"
          value={`R$ ${metrics.totalRevenue.toLocaleString('pt-BR')}`}
          icon={DollarSign}
          valueColor="text-green-600"
          subtitle="pagos + hospedagem concluída"
        />

        <MetricCard
          title="Receita Prevista"
          value={`R$ ${metrics.projectedRevenue.toLocaleString('pt-BR')}`}
          icon={TrendingUp}
          valueColor="text-blue-600"
          subtitle="total em pipeline"
        />

        <MetricCard
          title="Estadia Média"
          value={`${metrics.averageStayLength.toFixed(1)} dias`}
          icon={Clock}
          valueColor="text-purple-600"
          subtitle="duração média"
        />
      </div>

      {/* Gráficos e Análises */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Distribuição por Status */}
        <SimpleChart
          title="Leads por Status"
          data={statusData}
          type="donut"
        />

        {/* Receita por Mês */}
        <SimpleChart
          title="Receita por Mês"
          data={revenueData}
          type="bar"
        />

        {/* Top Pacotes */}
        <SimpleChart
          title="Top 5 Pacotes (Receita)"
          data={topPackagesData}
          type="bar"
        />

        {/* Funil de Conversão */}
        <SimpleChart
          title="Funil de Conversão"
          data={conversionData}
          type="line"
        />
      </div>

      {/* Métricas Detalhadas por Status */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Métricas por Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(metrics.leadsByStatus).map(([status, data]) => (
            <MetricCard
              key={status}
              title={status}
              value={data.count}
              subtitle={`R$ ${data.revenue.toLocaleString('pt-BR')} | ${data.percentage.toFixed(1)}%`}
              icon={Target}
              valueColor={getStatusValueColor(status)}
            />
          ))}
        </div>
      </div>

      {/* Distribuição por Tipo de Quarto */}
      {Object.keys(metrics.roomTypeDistribution).length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Distribuição por Tipo de Quarto</h2>
          <SimpleChart
            title="Preferências de Quarto"
            data={roomTypeData}
            type="donut"
          />
        </div>
      )}
    </div>
  );
};

// Funções auxiliares para cores
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'Novo': '#ef4444', // red
    'Lead': '#f97316', // orange
    'FUP 1': '#eab308', // yellow
    'Orçamento enviado': '#3b82f6', // blue
    'Link de Pagamento Enviado': '#8b5cf6', // purple
    'Pago | A se hospedar': '#10b981', // green
    'Hospedagem concluída': '#059669', // dark green
  };
  return colors[status] || '#6b7280'; // gray default
}

function getStatusValueColor(status: string): string {
  const statusColors: Record<string, string> = {
    'Novo': 'text-red-600',
    'Lead': 'text-orange-600',
    'FUP 1': 'text-yellow-600',
    'Orçamento enviado': 'text-blue-600',
    'Link de Pagamento Enviado': 'text-purple-600',
    'Pago | A se hospedar': 'text-green-600',
    'Hospedagem concluída': 'text-emerald-600',
  };
  return statusColors[status] || 'text-gray-600';
}

export default Dashboard;