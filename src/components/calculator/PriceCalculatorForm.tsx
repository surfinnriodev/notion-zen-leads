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

  const [result, setResult] = useState<ReturnType<typeof calculatePrice> | null>(null);

  const handleInputChange = (field: keyof CalculationInput, value: any) => {
    setInput(prev => ({ ...prev, [field]: value }));
  };

  const handleCalculate = () => {
    if (!input.checkInStart || !input.checkInEnd || !input.roomCategory) {
      alert("Preencha os campos obrigatórios: datas e categoria do quarto");
      return;
    }
    
    const calculation = calculatePrice(input, config);
    setResult(calculation);
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

      <Button onClick={handleCalculate} className="w-full">
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