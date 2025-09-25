import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  valueColor?: string;
}

export const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className = "",
  valueColor = "text-foreground"
}: MetricCardProps) => {
  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            {title}
          </h3>
          {Icon && (
            <Icon className="w-4 h-4 text-muted-foreground" />
          )}
        </div>

        <div className="space-y-1">
          <div className={`text-2xl font-bold ${valueColor}`}>
            {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
          </div>

          {subtitle && (
            <p className="text-xs text-muted-foreground">
              {subtitle}
            </p>
          )}

          {trend && (
            <div className={`text-xs font-medium flex items-center gap-1 ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              <span>{trend.isPositive ? '↗' : '↘'}</span>
              {Math.abs(trend.value)}% vs mês anterior
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};