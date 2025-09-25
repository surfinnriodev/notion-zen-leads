import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PricingConfig, CalculationInput } from "@/types/pricing";
import { calculatePrice } from "@/utils/priceCalculator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calculator, Plus, X, Settings } from "lucide-react";

interface CustomItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  billingType: 'fixed_price' | 'per_night' | 'per_day' | 'per_unit' | 'per_reservation';
  pricingModifier: 'per_room' | 'per_person' | 'per_reservation';
}

interface CustomPackage {
  id: string;
  name: string;
  price: number;
  status: 'active' | 'inactive';
}

interface PriceCalculatorFormProps {
  config: PricingConfig;
}

export const PriceCalculatorForm = ({ config }: PriceCalculatorFormProps) => {
  const [input, setInput] = useState<CalculationInput>({
    checkInStart: "",
    checkInEnd: "",
    numberOfPeople: 1,
    roomCategory: "",
  });

  const [customItems, setCustomItems] = useState<CustomItem[]>([]);
  const [customPackages, setCustomPackages] = useState<CustomPackage[]>([]);
  const [result, setResult] = useState<ReturnType<typeof calculatePrice> | null>(null);

  const handleInputChange = (field: keyof CalculationInput, value: any) => {
    setInput(prev => ({ ...prev, [field]: value }));
  };

  const addCustomItem = () => {
    const newItem: CustomItem = {
      id: `custom-${Date.now()}`,
      name: "",
      price: 0,
      quantity: 1,
      billingType: 'per_unit',
      pricingModifier: 'per_room'
    };
    setCustomItems(prev => [...prev, newItem]);
  };

  const updateCustomItem = (itemId: string, updates: Partial<CustomItem>) => {
    setCustomItems(prev =>
      prev.map(item => item.id === itemId ? { ...item, ...updates } : item)
    );
  };

  const removeCustomItem = (itemId: string) => {
    setCustomItems(prev => prev.filter(item => item.id !== itemId));
  };

  const addCustomPackage = () => {
    const newPackage: CustomPackage = {
      id: `package-${Date.now()}`,
      name: "",
      price: 0,
      status: 'inactive'
    };
    setCustomPackages(prev => [...prev, newPackage]);
  };

  const updateCustomPackage = (packageId: string, updates: Partial<CustomPackage>) => {
    setCustomPackages(prev =>
      prev.map(pkg => pkg.id === packageId ? { ...pkg, ...updates } : pkg)
    );
  };

  const removeCustomPackage = (packageId: string) => {
    setCustomPackages(prev => prev.filter(pkg => pkg.id !== packageId));
  };

  const handleCalculate = () => {
    if (!input.checkInStart || !input.checkInEnd || !input.roomCategory) {
      alert("Preencha os campos obrigatórios: datas e categoria do quarto");
      return;
    }

    const calculation = calculatePrice(input, config);

    // Adicionar cálculos personalizados
    const customCalculation = calculateCustomItems();
    const packageCalculation = calculateCustomPackages();

    const enhancedResult = {
      ...calculation,
      customItemsTotal: customCalculation.total,
      customPackagesTotal: packageCalculation.total,
      customItems: customCalculation.items,
      customPackages: packageCalculation.packages,
      finalTotal: calculation.totalPrice + customCalculation.total + packageCalculation.total
    };

    setResult(enhancedResult);
  };

  const calculateCustomItems = () => {
    const days = input.checkInStart && input.checkInEnd
      ? Math.ceil((new Date(input.checkInEnd).getTime() - new Date(input.checkInStart).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const itemCalculations = customItems.map(item => {
      let itemTotal = item.price * item.quantity;

      // Apply pricing modifier
      if (item.pricingModifier === 'per_person') {
        itemTotal *= input.numberOfPeople;
      }

      // Apply billing type multipliers
      if (item.billingType === 'per_day') {
        itemTotal *= days;
      } else if (item.billingType === 'per_night') {
        itemTotal *= Math.max(days - 1, 0); // nights = days - 1
      }

      return {
        ...item,
        calculatedPrice: itemTotal
      };
    });

    return {
      items: itemCalculations,
      total: itemCalculations.reduce((sum, item) => sum + item.calculatedPrice, 0)
    };
  };

  const calculateCustomPackages = () => {
    const activePackages = customPackages.filter(pkg => pkg.status === 'active');
    const total = activePackages.reduce((sum, pkg) => sum + pkg.price, 0);

    return {
      packages: activePackages,
      total
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Inputs básicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="checkIn">Check-in</Label>
          <Input
            id="checkIn"
            type="date"
            value={input.checkInStart}
            onChange={(e) => handleInputChange("checkInStart", e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="checkOut">Check-out</Label>
          <Input
            id="checkOut"
            type="date"
            value={input.checkInEnd}
            onChange={(e) => handleInputChange("checkInEnd", e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="people">Número de pessoas</Label>
          <Input
            id="people"
            type="number"
            min="1"
            value={input.numberOfPeople}
            onChange={(e) => handleInputChange("numberOfPeople", parseInt(e.target.value) || 1)}
          />
        </div>
        
        <div>
          <Label htmlFor="room">Categoria do quarto</Label>
          <Select value={input.roomCategory} onValueChange={(value) => handleInputChange("roomCategory", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo de quarto" />
            </SelectTrigger>
            <SelectContent>
              {config.roomCategories.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.name} - {formatCurrency(room.pricePerNight)}/noite
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pacotes */}
      <div>
        <Label htmlFor="package">Pacote (opcional)</Label>
        <Select value={input.packageId || "none"} onValueChange={(value) => handleInputChange("packageId", value === "none" ? undefined : value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um pacote (opcional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem pacote</SelectItem>
            {config.packages.map((pkg) => (
              <SelectItem key={pkg.id} value={pkg.id}>
                {pkg.name} - {formatCurrency(pkg.fixedPrice)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Extras */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Extras solicitados</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="breakfast">Café da manhã (dias)</Label>
            <Input
              id="breakfast"
              type="number"
              min="0"
              value={input.breakfast || ""}
              onChange={(e) => handleInputChange("breakfast", parseInt(e.target.value) || undefined)}
            />
          </div>
          
          <div>
            <Label htmlFor="board">Prancha ilimitada (dias)</Label>
            <Input
              id="board"
              type="number"
              min="0"
              value={input.unlimitedBoardRental || ""}
              onChange={(e) => handleInputChange("unlimitedBoardRental", parseInt(e.target.value) || undefined)}
            />
          </div>
          
          <div>
            <Label htmlFor="surfLessons">Aulas de surf</Label>
            <Input
              id="surfLessons"
              type="number"
              min="0"
              value={input.surfLessons || ""}
              onChange={(e) => handleInputChange("surfLessons", parseInt(e.target.value) || undefined)}
            />
          </div>
          
          <div>
            <Label htmlFor="yoga">Aulas de yoga</Label>
            <Input
              id="yoga"
              type="number"
              min="0"
              value={input.yogaLessons || ""}
              onChange={(e) => handleInputChange("yogaLessons", parseInt(e.target.value) || undefined)}
            />
          </div>
          
          <div>
            <Label htmlFor="skate">Surf-skate</Label>
            <Input
              id="skate"
              type="number"
              min="0"
              value={input.surfSkate || ""}
              onChange={(e) => handleInputChange("surfSkate", parseInt(e.target.value) || undefined)}
            />
          </div>
          
          <div>
            <Label htmlFor="video">Análise de vídeo</Label>
            <Input
              id="video"
              type="number"
              min="0"
              value={input.videoAnalysis || ""}
              onChange={(e) => handleInputChange("videoAnalysis", parseInt(e.target.value) || undefined)}
            />
          </div>
          
          <div>
            <Label htmlFor="massage">Massagem</Label>
            <Input
              id="massage"
              type="number"
              min="0"
              value={input.massage || ""}
              onChange={(e) => handleInputChange("massage", parseInt(e.target.value) || undefined)}
            />
          </div>
          
          <div>
            <Label htmlFor="guide">Surf guide</Label>
            <Input
              id="guide"
              type="number"
              min="0"
              value={input.surfGuide || ""}
              onChange={(e) => handleInputChange("surfGuide", parseInt(e.target.value) || undefined)}
            />
          </div>
          
          <div>
            <Label htmlFor="transfer">Transfer</Label>
            <Input
              id="transfer"
              type="number"
              min="0"
              value={input.transfer || ""}
              onChange={(e) => handleInputChange("transfer", parseInt(e.target.value) || undefined)}
            />
          </div>
        </div>

        {/* Atividades */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="hike">Trilhas</Label>
            <Input
              id="hike"
              type="number"
              min="0"
              value={input.hike || ""}
              onChange={(e) => handleInputChange("hike", parseInt(e.target.value) || undefined)}
            />
          </div>
          
          <div>
            <Label htmlFor="cityTour">Rio City Tour</Label>
            <Input
              id="cityTour"
              type="number"
              min="0"
              value={input.rioCityTour || ""}
              onChange={(e) => handleInputChange("rioCityTour", parseInt(e.target.value) || undefined)}
            />
          </div>
          
          <div>
            <Label htmlFor="carioca">Carioca Experience</Label>
            <Input
              id="carioca"
              type="number"
              min="0"
              value={input.cariocaExperience || ""}
              onChange={(e) => handleInputChange("cariocaExperience", parseInt(e.target.value) || undefined)}
            />
          </div>
        </div>
      </div>

      {/* Itens Personalizados */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Itens Personalizados</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addCustomItem}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <Plus className="w-4 h-4" />
            Adicionar Item
          </Button>
        </div>

        {customItems.map((item, index) => (
          <Card key={item.id} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
              <div className="md:col-span-2">
                <Label className="text-sm text-muted-foreground">Nome do item</Label>
                <Input
                  placeholder="Ex: Equipamento especial"
                  value={item.name}
                  onChange={(e) => updateCustomItem(item.id, { name: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Preço</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={item.price}
                  onChange={(e) => updateCustomItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Quantidade</Label>
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateCustomItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Tipo de cobrança</Label>
                <Select
                  value={item.billingType}
                  onValueChange={(value: any) => updateCustomItem(item.id, { billingType: value })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed_price">Preço fixo</SelectItem>
                    <SelectItem value="per_unit">Por unidade</SelectItem>
                    <SelectItem value="per_day">Por dia</SelectItem>
                    <SelectItem value="per_night">Por noite</SelectItem>
                    <SelectItem value="per_reservation">Por reserva</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Cobrança</Label>
                <Select
                  value={item.pricingModifier}
                  onValueChange={(value: any) => updateCustomItem(item.id, { pricingModifier: value })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_room">Por quarto</SelectItem>
                    <SelectItem value="per_person">Por pessoa</SelectItem>
                    <SelectItem value="per_reservation">Por reserva</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCustomItem(item.id)}
                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pacotes Personalizados */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Pacotes Personalizados</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addCustomPackage}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <Plus className="w-4 h-4" />
            Adicionar Pacote
          </Button>
        </div>

        {customPackages.map((pkg) => (
          <Card key={pkg.id} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
              <div className="md:col-span-2">
                <Label className="text-sm text-muted-foreground">Nome do pacote</Label>
                <Input
                  placeholder="Ex: Pacote Completo"
                  value={pkg.name}
                  onChange={(e) => updateCustomPackage(pkg.id, { name: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Preço total</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={pkg.price}
                  onChange={(e) => updateCustomPackage(pkg.id, { price: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Status</Label>
                <Select
                  value={pkg.status}
                  onValueChange={(value: any) => updateCustomPackage(pkg.id, { status: value })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCustomPackage(pkg.id)}
                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Button onClick={handleCalculate} className="w-full gap-2">
        <Calculator className="w-4 h-4" />
        Calcular Orçamento
      </Button>

      {/* Resultado */}
      {result && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Resultado do Cálculo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Noites:</span> {result.numberOfNights}
              </div>
              <div>
                <span className="text-muted-foreground">Pessoas:</span> {result.numberOfPeople}
              </div>
            </div>

            <Separator />

            {/* Breakdown */}
            <div className="space-y-3">
              {result.breakdown.package && (
                <div className="flex justify-between">
                  <span>{result.breakdown.package.name}</span>
                  <span className="font-medium">{formatCurrency(result.breakdown.package.cost)}</span>
                </div>
              )}
              
              {result.breakdown.accommodation && (
                <div className="flex justify-between">
                  <span>{result.breakdown.accommodation.description}</span>
                  <span className="font-medium">{formatCurrency(result.breakdown.accommodation.cost)}</span>
                </div>
              )}
              
              {result.breakdown.dailyItems.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.name} ({item.quantity}x {formatCurrency(item.unitPrice)})</span>
                  <span>{formatCurrency(item.cost)}</span>
                </div>
              ))}
              
              {result.breakdown.fixedItems.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.name} ({item.quantity}x {formatCurrency(item.unitPrice)})</span>
                  <span>{formatCurrency(item.cost)}</span>
                </div>
              ))}
            </div>

            <Separator />
            
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(result.totalCost)}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};