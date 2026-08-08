import { PricingConfigForm } from "@/components/calculator/PricingConfigForm";
import { useRegion } from '@/contexts/RegionContext';
import { usePricingConfig } from "@/hooks/usePricingConfig";

const Configuracoes = () => {
  const region = useRegion();
  const { config, updateConfig, resetToDefault } = usePricingConfig(region);

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
