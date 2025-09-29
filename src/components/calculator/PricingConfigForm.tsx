import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PricingConfig, RoomCategory, PackageConfig, PricingItem } from "@/types/pricing";
import { AVAILABLE_PRICING_ITEMS } from "@/hooks/usePricingConfig";
import { useSurfPricingTiers } from "@/hooks/useSurfPricingTiers";
import { X, Plus, RotateCcw, Info } from "lucide-react";

interface PricingConfigFormProps {
  config: PricingConfig;
  onUpdateConfig: (config: Partial<PricingConfig>) => void;
  onReset: () => void;
}

export const PricingConfigForm = ({ config, onUpdateConfig, onReset }: PricingConfigFormProps) => {
  const [editingRoom, setEditingRoom] = useState<RoomCategory | null>(null);
  const [editingPackage, setEditingPackage] = useState<PackageConfig | null>(null);
  const [availableItems, setAvailableItems] = useState<PricingItem[]>([]);
  
  // Usar o contexto das faixas de preço de surf
  const { tiers: surfPricingTiers, updateTiers } = useSurfPricingTiers();

  // Atualizar itens disponíveis quando config muda
  React.useEffect(() => {
    setAvailableItems(
      AVAILABLE_PRICING_ITEMS.filter(item => !(config.items || []).find(configItem => configItem.id === item.id))
    );
  }, [config.items]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para atualizar as faixas de preço de surf
  const updateSurfPricingTier = (tier: keyof typeof surfPricingTiers, value: number) => {
    const newTiers = {
      ...surfPricingTiers,
      [tier]: value
    };
    updateTiers(newTiers);
  };

  // Função para salvar as faixas de preço
  const saveSurfPricingTiers = () => {
    // As faixas já são salvas automaticamente no contexto
    console.log('Faixas de preço atualizadas:', surfPricingTiers);
    alert('Faixas de preço atualizadas com sucesso!');
  };

  const addRoom = () => {
    const newRoom: RoomCategory = {
      id: `room-${Date.now()}`,
      name: "Nova Categoria",
      pricePerNight: 100,
      perPerson: false,
    };
    onUpdateConfig({
      roomCategories: [...config.roomCategories, newRoom],
    });
  };

  const updateRoom = (roomId: string, updates: Partial<RoomCategory>) => {
    onUpdateConfig({
      roomCategories: config.roomCategories.map(room =>
        room.id === roomId ? { ...room, ...updates } : room
      ),
    });
  };

  const removeRoom = (roomId: string) => {
    onUpdateConfig({
      roomCategories: config.roomCategories.filter(room => room.id !== roomId),
    });
  };

  // Funções para gerenciar itens dinâmicos
  const addItemFromAvailable = (availableItem: PricingItem) => {
    const newItem = { ...availableItem };
    onUpdateConfig({
      items: [...(config.items || []), newItem],
    });
    setAvailableItems(prev => prev.filter(item => item.id !== availableItem.id));
  };

  const addCustomItem = () => {
    const newItem: PricingItem = {
      id: `custom-${Date.now()}`,
      name: "Novo item personalizado",
      price: 0,
      billingType: 'per_unit',
      category: 'fixed',
    };
    onUpdateConfig({
      items: [...(config.items || []), newItem],
    });
  };

  const updateItem = (itemId: string, updates: Partial<PricingItem>) => {
    onUpdateConfig({
      items: (config.items || []).map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    });
  };

  const removeItem = (itemId: string) => {
    const removedItem = (config.items || []).find(item => item.id === itemId);
    onUpdateConfig({
      items: (config.items || []).filter(item => item.id !== itemId),
    });
    // Volta para itens disponíveis se for um item predefinido
    if (removedItem && AVAILABLE_PRICING_ITEMS.find(item => item.id === removedItem.id)) {
      setAvailableItems(prev => [...prev, AVAILABLE_PRICING_ITEMS.find(item => item.id === removedItem.id)!]);
    }
  };

  // Funções para gerenciar pacotes
  const addPackage = () => {
    const newPackage: PackageConfig = {
      id: `package-${Date.now()}`,
      name: "Novo Pacote",
      fixedPrice: 0,
      overridesIndividualPricing: true,
      includedItems: {},
    };
    onUpdateConfig({
      packages: [...config.packages, newPackage],
    });
  };

  const updatePackage = (packageId: string, updates: Partial<PackageConfig>) => {
    onUpdateConfig({
      packages: config.packages.map(pkg =>
        pkg.id === packageId ? { ...pkg, ...updates } : pkg
      ),
    });
  };

  const removePackage = (packageId: string) => {
    onUpdateConfig({
      packages: config.packages.filter(pkg => pkg.id !== packageId),
    });
  };


  return (
    <div className="space-y-6">
      {/* Categorias de Quarto */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-medium">Categorias de Quartos</CardTitle>
          <Button size="sm" variant="ghost" onClick={addRoom} className="gap-2 text-muted-foreground hover:text-foreground">
            <Plus className="w-4 h-4" />
            Adicionar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.roomCategories.map((room) => (
            <div key={room.id} className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="flex-1 grid grid-cols-3 gap-4">
                <div>
                  <Label>Nome da categoria</Label>
                  <Input
                    value={room.name}
                    onChange={(e) => updateRoom(room.id, { name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Preço por noite</Label>
                  <Input
                    type="number"
                    value={room.pricePerNight}
                    onChange={(e) => updateRoom(room.id, { pricePerNight: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Tipo de cobrança</Label>
                  <Select
                    value={room.billingType}
                    onValueChange={(value: any) => updateRoom(room.id, { billingType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_room">Por quarto</SelectItem>
                      <SelectItem value="per_person">Por pessoa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeRoom(room.id)}
                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Pacotes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-medium">Pacotes</CardTitle>
          <Button size="sm" variant="ghost" onClick={addPackage} className="gap-2 text-muted-foreground hover:text-foreground">
            <Plus className="w-4 h-4" />
            Adicionar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.packages.map((pkg) => (
            <div key={pkg.id} className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="flex-1 grid grid-cols-4 gap-4">
                <div>
                  <Label>Nome do pacote</Label>
                  <Input
                    value={pkg.name}
                    onChange={(e) => updatePackage(pkg.id, { name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Preço total</Label>
                  <Input
                    type="number"
                    value={pkg.fixedPrice}
                    onChange={(e) => updatePackage(pkg.id, { fixedPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Comportamento</Label>
                  <Select
                    value={pkg.overridesIndividualPricing ? "override" : "add"}
                    onValueChange={(value) => updatePackage(pkg.id, { overridesIndividualPricing: value === "override" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="override">Substitui preços individuais</SelectItem>
                      <SelectItem value="add">Soma com preços individuais</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <div className="text-xs text-muted-foreground">
                    {pkg.overridesIndividualPricing
                      ? "Preço fixo total do pacote"
                      : "Preço adicional + itens individuais"}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removePackage(pkg.id)}
                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {config.packages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Nenhum pacote configurado</p>
              <p className="text-xs mt-1">Use o botão acima para criar pacotes personalizados</p>
            </div>
          )}
        </CardContent>
      </Card>


      {/* Itens de Cobrança */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-medium">Itens de Cobrança</CardTitle>
          <div className="flex gap-2">
            {availableItems.length > 0 && (
              <Select onValueChange={(value) => {
                const item = availableItems.find(i => i.id === value);
                if (item) addItemFromAvailable(item);
              }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Do banco de dados..." />
                </SelectTrigger>
                <SelectContent>
                  {availableItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={addCustomItem}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Faixas de Preço para Aulas de Surf - Editável */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-medium">Faixas de Preço - Aulas de Surf</h3>
              </div>
              <Button 
                size="sm" 
                onClick={saveSurfPricingTiers}
                className="h-8 px-3"
              >
                Salvar
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-white dark:bg-gray-800 rounded border">
                <Label className="text-xs text-gray-500">1-3 aulas por pessoa</Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm">R$</span>
                  <Input
                    type="number"
                    value={surfPricingTiers.tier1to3}
                    onChange={(e) => updateSurfPricingTier('tier1to3', parseInt(e.target.value) || 0)}
                    className="h-8 text-sm"
                    min="0"
                    step="1"
                  />
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded border">
                <Label className="text-xs text-gray-500">4-7 aulas por pessoa</Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm">R$</span>
                  <Input
                    type="number"
                    value={surfPricingTiers.tier4to7}
                    onChange={(e) => updateSurfPricingTier('tier4to7', parseInt(e.target.value) || 0)}
                    className="h-8 text-sm"
                    min="0"
                    step="1"
                  />
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded border">
                <Label className="text-xs text-gray-500">8+ aulas por pessoa</Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm">R$</span>
                  <Input
                    type="number"
                    value={surfPricingTiers.tier8plus}
                    onChange={(e) => updateSurfPricingTier('tier8plus', parseInt(e.target.value) || 0)}
                    className="h-8 text-sm"
                    min="0"
                    step="1"
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              O preço é determinado automaticamente pela quantidade total de aulas por pessoa. Clique em "Salvar" para aplicar as alterações.
            </p>
          </div>

          {(config.items || []).map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="flex-1 grid grid-cols-4 gap-4">
                <div>
                  <Label>Nome do item</Label>
                  <Input
                    value={item.name}
                    onChange={(e) => updateItem(item.id, { name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Preço</Label>
                  <Input
                    type="number"
                    value={item.price}
                    onChange={(e) => updateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Tipo de cobrança</Label>
                  <Select
                    value={item.billingType}
                    onValueChange={(value: any) => updateItem(item.id, { billingType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_unit">Por unidade</SelectItem>
                      <SelectItem value="per_person">Por pessoa</SelectItem>
                      <SelectItem value="per_room">Por quarto</SelectItem>
                      <SelectItem value="per_reservation">Por reserva</SelectItem>
                      <SelectItem value="per_day">Por dia</SelectItem>
                      <SelectItem value="per_night">Por noite</SelectItem>
                      <SelectItem value="boolean">Sim/Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Select
                    value={item.category}
                    onValueChange={(value: any) => updateItem(item.id, { category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Quantidade fixa</SelectItem>
                      <SelectItem value="daily">Multiplica por dias</SelectItem>
                      <SelectItem value="boolean">Opcional (Sim/Não)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeItem(item.id)}
                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {(!config.items || config.items.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Nenhum item de cobrança configurado</p>
              <p className="text-xs mt-1">Use o seletor acima para adicionar itens do banco de dados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};