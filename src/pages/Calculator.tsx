import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator as CalculatorIcon, Settings } from "lucide-react";

const Calculator = () => {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Calculadora
        </h1>
        <p className="text-muted-foreground">
          Configure preços e realize cálculos de reservas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações de Preço */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configurações de Preços
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Aguardando especificações dos preços...
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Área de Cálculos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalculatorIcon className="w-5 h-5" />
              Cálculos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Aguardando especificações dos cálculos...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Calculator;