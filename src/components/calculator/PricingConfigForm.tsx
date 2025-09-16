import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { PricingConfig, RoomCategory, PackageConfig } from "@/types/pricing";
import { Trash2, Plus, RotateCcw } from "lucide-react";

interface PricingConfigFormProps {
  config: PricingConfig;
  onUpdateConfig: (config: Partial<PricingConfig>) => void;
  onReset: () => void;
}

export const PricingConfigForm = ({ config, onUpdateConfig, onReset }: PricingConfigFormProps) => {
  const [editingRoom, setEditingRoom] = useState<RoomCategory | null>(null);
  const [editingPackage, setEditingPackage] = useState<PackageConfig | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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

  const updateDailyItem = (item: 'breakfast' | 'unlimitedBoardRental', field: 'price' | 'perPerson', value: any) => {
    onUpdateConfig({
      dailyItems: {
        ...config.dailyItems,
        [item]: {
          ...config.dailyItems[item],
          [field]: value,
        },
      },
    });
  };

  const updateFixedItem = (category: string, item: string, field: string, value: any) => {
    if (category) {
      onUpdateConfig({
        fixedItems: {
          ...config.fixedItems,
          [category]: {
            ...config.fixedItems[category as keyof typeof config.fixedItems],
            [item]: {
              ...(config.fixedItems[category as keyof typeof config.fixedItems] as any)[item],
              [field]: value,
            },
          },
        },
      });
    } else {
      onUpdateConfig({
        fixedItems: {
          ...config.fixedItems,
          [item]: {
            ...(config.fixedItems as any)[item],
            [field]: value,
          },
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Reset Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={onReset} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Restaurar Padrões
        </Button>
      </div>

      {/* Categorias de Quarto */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Categorias de Quartos</CardTitle>
          <Button size="sm" onClick={addRoom} className="gap-2">
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
                <div className="flex items-center gap-2">
                  <Switch
                    checked={room.perPerson}
                    onCheckedChange={(checked) => updateRoom(room.id, { perPerson: checked })}
                  />
                  <Label>Por pessoa</Label>
                </div>
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => removeRoom(room.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Itens Diários */}
      <Card>
        <CardHeader>
          <CardTitle>Itens que multiplicam por dias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Café da manhã</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={config.dailyItems.breakfast.price}
                  onChange={(e) => updateDailyItem('breakfast', 'price', parseFloat(e.target.value) || 0)}
                />
                <Switch
                  checked={config.dailyItems.breakfast.perPerson}
                  onCheckedChange={(checked) => updateDailyItem('breakfast', 'perPerson', checked)}
                />
                <Label>Por pessoa</Label>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Aluguel prancha ilimitado</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={config.dailyItems.unlimitedBoardRental.price}
                  onChange={(e) => updateDailyItem('unlimitedBoardRental', 'price', parseFloat(e.target.value) || 0)}
                />
                <Switch
                  checked={config.dailyItems.unlimitedBoardRental.perPerson}
                  onCheckedChange={(checked) => updateDailyItem('unlimitedBoardRental', 'perPerson', checked)}
                />
                <Label>Por pessoa</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Itens Fixos */}
      <Card>
        <CardHeader>
          <CardTitle>Itens com valor fixo (por unidade)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Aulas de Surf com Faixas */}
          <div>
            <h4 className="font-medium mb-3">Aulas de Surf (por faixas)</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>1-3 aulas</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={config.fixedItems.surfLessons.tier1_3.price}
                    onChange={(e) => updateFixedItem('surfLessons', 'tier1_3', 'price', parseFloat(e.target.value) || 0)}
                  />
                  <Switch
                    checked={config.fixedItems.surfLessons.tier1_3.perPerson}
                    onCheckedChange={(checked) => updateFixedItem('surfLessons', 'tier1_3', 'perPerson', checked)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>4-7 aulas</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={config.fixedItems.surfLessons.tier4_7.price}
                    onChange={(e) => updateFixedItem('surfLessons', 'tier4_7', 'price', parseFloat(e.target.value) || 0)}
                  />
                  <Switch
                    checked={config.fixedItems.surfLessons.tier4_7.perPerson}
                    onCheckedChange={(checked) => updateFixedItem('surfLessons', 'tier4_7', 'perPerson', checked)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>8+ aulas</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={config.fixedItems.surfLessons.tier8plus.price}
                    onChange={(e) => updateFixedItem('surfLessons', 'tier8plus', 'price', parseFloat(e.target.value) || 0)}
                  />
                  <Switch
                    checked={config.fixedItems.surfLessons.tier8plus.perPerson}
                    onCheckedChange={(checked) => updateFixedItem('surfLessons', 'tier8plus', 'perPerson', checked)}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Outros Itens Fixos */}
          <div className="grid grid-cols-2 gap-6">
            {Object.entries({
              yogaLessons: 'Aulas de yoga',
              surfSkate: 'Surf-skate',
              videoAnalysis: 'Análise de vídeo',
              massage: 'Massagem',
              surfGuide: 'Surf guide',
            }).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={(config.fixedItems as any)[key].price}
                    onChange={(e) => updateFixedItem('', key, 'price', parseFloat(e.target.value) || 0)}
                  />
                  <Switch
                    checked={(config.fixedItems as any)[key].perPerson}
                    onCheckedChange={(checked) => updateFixedItem('', key, 'perPerson', checked)}
                  />
                  <Label className="text-xs">Por pessoa</Label>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Transfer */}
          <div className="space-y-2">
            <Label>Transfer (por trecho/reserva)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={config.fixedItems.transfer.price}
                onChange={(e) => updateFixedItem('', 'transfer', 'price', parseFloat(e.target.value) || 0)}
              />
              <Switch
                checked={config.fixedItems.transfer.perReservation}
                onCheckedChange={(checked) => updateFixedItem('', 'transfer', 'perReservation', checked)}
              />
              <Label className="text-xs">Por reserva</Label>
            </div>
          </div>

          <Separator />

          {/* Atividades */}
          <div>
            <h4 className="font-medium mb-3">Atividades</h4>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries({
                hike: 'Trilha',
                rioCityTour: 'Rio City Tour',
                cariocaExperience: 'Carioca Experience',
              }).map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <Label>{label}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={(config.fixedItems.activities as any)[key].price}
                      onChange={(e) => updateFixedItem('activities', key, 'price', parseFloat(e.target.value) || 0)}
                    />
                    <Switch
                      checked={(config.fixedItems.activities as any)[key].perPerson}
                      onCheckedChange={(checked) => updateFixedItem('activities', key, 'perPerson', checked)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};