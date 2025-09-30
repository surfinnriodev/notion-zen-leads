import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PricingConfig, RoomCategory, PackageConfig, PricingItem } from "@/types/pricing";
import { AVAILABLE_PRICING_ITEMS } from "@/hooks/usePricingConfig";
import { X, Plus, RotateCcw, Info, Save } from "lucide-react";

interface PricingConfigFormProps {
  config: PricingConfig;
  onUpdateConfig: (config: Partial<PricingConfig>) => void;
  onReset: () => void;
}

export const PricingConfigForm = ({ config, onUpdateConfig, onReset }: PricingConfigFormProps) => {
  const [editingRoom, setEditingRoom] = useState<RoomCategory | null>(null);
  const [editingPackage, setEditingPackage] = useState<PackageConfig | null>(null);
  const [availableItems, setAvailableItems] = useState<PricingItem[]>([]);
  const [localConfig, setLocalConfig] = useState<PricingConfig>(config);
  const [hasChanges, setHasChanges] = useState(false);

  // Atualizar config local quando o config externo muda
  React.useEffect(() => {
    setLocalConfig(config);
    setHasChanges(false);
  }, [config]);

  // Atualizar itens disponíveis quando config muda
  React.useEffect(() => {
    setAvailableItems(
      AVAILABLE_PRICING_ITEMS.filter(item => !(localConfig.items || []).find(configItem => configItem.id === item.id))
    );
  }, [localConfig.items]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const addRoom = () => {
    const newRoom: RoomCategory = {
      id: `room-${Date.now()}`,
      name: "Private: Double",
      pricePerNight: 100,
      billingType: 'per_room',
    };
    setLocalConfig({
      ...localConfig,
      roomCategories: [...localConfig.roomCategories, newRoom],
    });
    setHasChanges(true);
  };

  const updateRoom = (roomId: string, updates: Partial<RoomCategory>) => {
    setLocalConfig({
      ...localConfig,
      roomCategories: localConfig.roomCategories.map(room =>
        room.id === roomId ? { ...room, ...updates } : room
      ),
    });
    setHasChanges(true);
  };

  const removeRoom = (roomId: string) => {
    setLocalConfig({
      ...localConfig,
      roomCategories: localConfig.roomCategories.filter(room => room.id !== roomId),
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdateConfig(localConfig);
    setHasChanges(false);
  };

  const handleCancel = () => {
    setLocalConfig(config);
    setHasChanges(false);
  };

  // Funções para gerenciar itens dinâmicos
  const addItemFromAvailable = (availableItem: PricingItem) => {
    const newItem = { ...availableItem };
    setLocalConfig({
      ...localConfig,
      items: [...(localConfig.items || []), newItem],
    });
    setHasChanges(true);
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
    setLocalConfig({
      ...localConfig,
      items: [...(localConfig.items || []), newItem],
    });
    setHasChanges(true);
  };

  const updateItem = (itemId: string, updates: Partial<PricingItem>) => {
    setLocalConfig({
      ...localConfig,
      items: (localConfig.items || []).map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    });
    setHasChanges(true);
  };

  const removeItem = (itemId: string) => {
    const removedItem = (localConfig.items || []).find(item => item.id === itemId);
    setLocalConfig({
      ...localConfig,
      items: (localConfig.items || []).filter(item => item.id !== itemId),
    });
    setHasChanges(true);
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
    setLocalConfig({
      ...localConfig,
      packages: [...localConfig.packages, newPackage],
    });
    setHasChanges(true);
  };

  const updatePackage = (packageId: string, updates: Partial<PackageConfig>) => {
    setLocalConfig({
      ...localConfig,
      packages: localConfig.packages.map(pkg =>
        pkg.id === packageId ? { ...pkg, ...updates } : pkg
      ),
    });
    setHasChanges(true);
  };

  const removePackage = (packageId: string) => {
    setLocalConfig({
      ...localConfig,
      packages: localConfig.packages.filter(pkg => pkg.id !== packageId),
    });
    setHasChanges(true);
  };


  return (
    <div className="space-y-6">
      {/* Categorias de Quarto */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-medium">Tipos de Acomodação</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Configure os preços para cada tipo de quarto disponível
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={addRoom} className="gap-2 text-muted-foreground hover:text-foreground">
            <Plus className="w-4 h-4" />
            Adicionar Tipo
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Agrupar por categoria */}
          <div className="space-y-6">
            {/* Private Rooms */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b">
                <h3 className="text-sm font-semibold text-primary">🏠 Private Rooms</h3>
                <span className="text-xs text-muted-foreground">
                  ({localConfig.roomCategories.filter(r => r.name.startsWith('Private:')).length} tipos)
                </span>
              </div>
              {localConfig.roomCategories
                .filter(room => room.name.startsWith('Private:'))
                .map((room) => (
                  <div key={room.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border">
                    <div className="flex-1 grid grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs">Tipo de Quarto</Label>
                        <Select
                          value={room.name}
                          onValueChange={(value) => updateRoom(room.id, { name: value })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Private: Shared bathroom">Shared bathroom</SelectItem>
                            <SelectItem value="Private: Double">Double</SelectItem>
                            <SelectItem value="Private: Sea-View">Sea-View</SelectItem>
                            <SelectItem value="Private: Triple">Triple</SelectItem>
                            <SelectItem value="Private: Family">Family</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Preço/Noite</Label>
                        <Input
                          type="number"
                          value={room.pricePerNight}
                          onChange={(e) => updateRoom(room.id, { pricePerNight: parseFloat(e.target.value) || 0 })}
                          className="h-9"
                          placeholder="150"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Cobrança</Label>
                        <Select
                          value={room.billingType}
                          onValueChange={(value: any) => updateRoom(room.id, { billingType: value })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="per_room">Por quarto</SelectItem>
                            <SelectItem value="per_person">Por pessoa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(room.pricePerNight)} / {room.billingType === 'per_room' ? 'quarto' : 'pessoa'}
                        </div>
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
              {localConfig.roomCategories.filter(r => r.name.startsWith('Private:')).length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-xs">
                  Nenhum quarto privado configurado
                </div>
              )}
            </div>

            {/* Shared Rooms */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b">
                <h3 className="text-sm font-semibold text-primary">🛏️ Shared Rooms</h3>
                <span className="text-xs text-muted-foreground">
                  ({localConfig.roomCategories.filter(r => r.name.startsWith('Shared:')).length} tipos)
                </span>
              </div>
              {localConfig.roomCategories
                .filter(room => room.name.startsWith('Shared:'))
                .map((room) => (
                  <div key={room.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border">
                    <div className="flex-1 grid grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs">Tipo de Quarto</Label>
                        <Select
                          value={room.name}
                          onValueChange={(value) => updateRoom(room.id, { name: value })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Shared: Mixed Economic">Mixed Economic</SelectItem>
                            <SelectItem value="Shared: Mixed Standard">Mixed Standard</SelectItem>
                            <SelectItem value="Shared: Female Economic">Female Economic</SelectItem>
                            <SelectItem value="Shared: Female Standard">Female Standard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Preço/Noite</Label>
                        <Input
                          type="number"
                          value={room.pricePerNight}
                          onChange={(e) => updateRoom(room.id, { pricePerNight: parseFloat(e.target.value) || 0 })}
                          className="h-9"
                          placeholder="80"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Cobrança</Label>
                        <Select
                          value={room.billingType}
                          onValueChange={(value: any) => updateRoom(room.id, { billingType: value })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="per_room">Por quarto</SelectItem>
                            <SelectItem value="per_person">Por pessoa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(room.pricePerNight)} / {room.billingType === 'per_room' ? 'quarto' : 'pessoa'}
                        </div>
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
              {localConfig.roomCategories.filter(r => r.name.startsWith('Shared:')).length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-xs">
                  Nenhum quarto compartilhado configurado
                </div>
              )}
            </div>

            {/* Outros tipos */}
            {localConfig.roomCategories.filter(r => !r.name.startsWith('Private:') && !r.name.startsWith('Shared:')).length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <h3 className="text-sm font-semibold text-primary">🏷️ Outros</h3>
                  <span className="text-xs text-muted-foreground">
                    ({localConfig.roomCategories.filter(r => !r.name.startsWith('Private:') && !r.name.startsWith('Shared:')).length} tipos)
                  </span>
                </div>
                {localConfig.roomCategories
                  .filter(room => !room.name.startsWith('Private:') && !room.name.startsWith('Shared:'))
                  .map((room) => (
                    <div key={room.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border">
                      <div className="flex-1 grid grid-cols-4 gap-3">
                <div>
                          <Label className="text-xs">Nome Personalizado</Label>
                  <Input
                    value={room.name}
                    onChange={(e) => updateRoom(room.id, { name: e.target.value })}
                            className="h-9"
                  />
                </div>
                <div>
                          <Label className="text-xs">Preço/Noite</Label>
                  <Input
                    type="number"
                    value={room.pricePerNight}
                    onChange={(e) => updateRoom(room.id, { pricePerNight: parseFloat(e.target.value) || 0 })}
                            className="h-9"
                  />
                </div>
                <div>
                          <Label className="text-xs">Cobrança</Label>
                  <Select
                    value={room.billingType}
                    onValueChange={(value: any) => updateRoom(room.id, { billingType: value })}
                  >
                            <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_room">Por quarto</SelectItem>
                      <SelectItem value="per_person">Por pessoa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                        <div className="flex items-end">
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(room.pricePerNight)} / {room.billingType === 'per_room' ? 'quarto' : 'pessoa'}
                          </div>
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
              </div>
            )}
          </div>

          {/* Menu de adição rápida */}
          <div className="border-t pt-4">
            <Label className="text-xs text-muted-foreground mb-2 block">Adicionar tipo de quarto:</Label>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const newRoom: RoomCategory = {
                    id: `room-${Date.now()}`,
                    name: "Private: Double",
                    pricePerNight: 150,
                    billingType: 'per_room',
                  };
                  setLocalConfig({ ...localConfig, roomCategories: [...localConfig.roomCategories, newRoom] });
                  setHasChanges(true);
                }}
                className="text-xs"
              >
                + Private Room
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const newRoom: RoomCategory = {
                    id: `room-${Date.now()}`,
                    name: "Shared: Mixed Standard",
                    pricePerNight: 80,
                    billingType: 'per_person',
                  };
                  setLocalConfig({ ...localConfig, roomCategories: [...localConfig.roomCategories, newRoom] });
                  setHasChanges(true);
                }}
                className="text-xs"
              >
                + Shared Room
              </Button>
            </div>
          </div>
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
          {localConfig.packages.map((pkg) => (
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
          {localConfig.packages.length === 0 && (
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
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-white dark:bg-gray-800 rounded border">
                <Label className="text-xs text-gray-500">1-3 aulas por pessoa</Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm">R$</span>
                  <Input
                    type="number"
                    value={localConfig.surfLessonPricing?.tier1 || 180}
                    onChange={(e) => {
                      setLocalConfig({
                        ...localConfig,
                      surfLessonPricing: {
                          ...localConfig.surfLessonPricing,
                        tier1: parseFloat(e.target.value) || 180
                      }
                      });
                      setHasChanges(true);
                    }}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded border">
                <Label className="text-xs text-gray-500">4-7 aulas por pessoa</Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm">R$</span>
                  <Input
                    type="number"
                    value={localConfig.surfLessonPricing?.tier2 || 160}
                    onChange={(e) => {
                      setLocalConfig({
                        ...localConfig,
                      surfLessonPricing: {
                          ...localConfig.surfLessonPricing,
                        tier2: parseFloat(e.target.value) || 160
                      }
                      });
                      setHasChanges(true);
                    }}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded border">
                <Label className="text-xs text-gray-500">8+ aulas por pessoa</Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm">R$</span>
                  <Input
                    type="number"
                    value={localConfig.surfLessonPricing?.tier3 || 140}
                    onChange={(e) => {
                      setLocalConfig({
                        ...localConfig,
                      surfLessonPricing: {
                          ...localConfig.surfLessonPricing,
                        tier3: parseFloat(e.target.value) || 140
                      }
                      });
                      setHasChanges(true);
                    }}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              O preço é determinado automaticamente pela quantidade total de aulas por pessoa.
            </p>
          </div>

          {(localConfig.items || []).map((item) => (
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
          {(!localConfig.items || localConfig.items.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Nenhum item de cobrança configurado</p>
              <p className="text-xs mt-1">Use o seletor acima para adicionar itens do banco de dados</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botão de Salvar Alterações */}
      {hasChanges && (
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span>Você tem alterações não salvas</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                className="gap-2 bg-primary hover:bg-primary/90"
              >
                <Save className="w-4 h-4" />
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};