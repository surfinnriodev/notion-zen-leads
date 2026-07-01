import { PricingConfigForm } from "@/components/calculator/PricingConfigForm";
import { usePricingConfig } from "@/hooks/usePricingConfig";

const Configuracoes = () => {
  const { config, updateConfig, resetToDefault } = usePricingConfig();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Configurações
        </h1>
        <p className="text-muted-foreground text-sm">
          Gerencie preços globais, pacotes e categorias de quarto
        </p>
      </div>

      <PricingConfigForm
        config={config}
        onUpdateConfig={updateConfig}
        onReset={resetToDefault}
      />
    </div>
  );
};

export default Configuracoes;
