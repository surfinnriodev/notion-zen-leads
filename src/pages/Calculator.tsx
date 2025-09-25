import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator as CalculatorIcon, Settings, RotateCcw } from "lucide-react";
import { PricingConfigForm } from "@/components/calculator/PricingConfigForm";
import { PriceCalculatorForm } from "@/components/calculator/PriceCalculatorForm";
import { usePricingConfig } from "@/hooks/usePricingConfig";

const Calculator = () => {
  const { config, updateConfig, resetToDefault } = usePricingConfig();

  return (
    <div className="p-6">
      {/* Header simples */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Calculadora de Preços
        </h1>
        <p className="text-muted-foreground text-sm">
          Configure preços e realize cálculos de reservas
        </p>
      </div>

      {/* Tabs minimalistas */}
      <Tabs defaultValue="calculator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <CalculatorIcon className="w-4 h-4" />
            Calculadora
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">Calcular Orçamento</CardTitle>
            </CardHeader>
            <CardContent>
              <PriceCalculatorForm config={config} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <PricingConfigForm
            config={config}
            onUpdateConfig={updateConfig}
            onReset={resetToDefault}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Calculator;