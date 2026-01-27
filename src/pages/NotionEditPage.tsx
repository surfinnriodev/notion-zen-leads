import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNotionPage } from "@/hooks/useNotionPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function NotionEditPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error, updatePage, isUpdating } = useNotionPage(pageId || null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Inicializar formData quando os dados forem carregados
  useEffect(() => {
    if (data?.properties) {
      setFormData(data.properties);
    }
  }, [data]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pageId) {
      toast.error("Page ID não encontrado");
      return;
    }

    updatePage(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-muted-foreground">Carregando página do Notion...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Erro ao carregar página</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : "Erro desconhecido"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(-1)} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Nenhum dado encontrado</p>
      </div>
    );
  }

  const { properties, propertyTypes, rawProperties } = data;

  // Lista de campos permitidos para edição (baseado na imagem fornecida)
  // Usando os nomes exatos como aparecem no Notion
  const allowedFields = [
    "Aulas de Yoga",
    "Aulas de surf",
    "Aluguel prancha ilimitado",
    "Análise de vídeo (Extra)",
    "Análise de vídeo (Package)",
    "Carioca Experience (extra)",
    "Hike (extra)",
    "Include breakfast",
    "Massagem (Extra)",
    "Massagem (Package)",
    "Rio City Tour (extra)",
    "Skate",
    "Surf Guide (Package)",
    "Transfer (Extra) ", // Note: tem espaço no final no Notion
    "Transfer (Package)",
  ];
  
  // Criar um Set para busca mais eficiente
  const allowedFieldsSet = new Set(allowedFields);

  // Filtrar apenas os campos permitidos
  const filteredProperties = Object.entries(properties).filter(([key]) => 
    allowedFieldsSet.has(key)
  );
  
  console.log("🔍 [PAGE] Campos filtrados:", {
    total: Object.keys(properties).length,
    filtrados: filteredProperties.length,
    campos: filteredProperties.map(([key]) => key),
  });

  // Função para renderizar campo baseado no tipo
  const renderField = (key: string, value: any, type: string) => {
    const label = key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

    switch (type) {
      case "title":
      case "rich_text":
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{label}</Label>
            <Input
              id={key}
              value={value || ""}
              onChange={(e) => handleInputChange(key, e.target.value)}
              placeholder={`Digite ${label.toLowerCase()}`}
            />
          </div>
        );

      case "number":
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{label}</Label>
            <Input
              id={key}
              type="number"
              value={value ?? ""}
              onChange={(e) => handleInputChange(key, e.target.value ? Number(e.target.value) : null)}
              placeholder={`Digite ${label.toLowerCase()}`}
            />
          </div>
        );

      case "checkbox":
        return (
          <div key={key} className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={key}
              checked={value || false}
              onChange={(e) => handleInputChange(key, e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <Label htmlFor={key} className="cursor-pointer">
              {label}
            </Label>
          </div>
        );

      case "date":
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{label}</Label>
            <Input
              id={key}
              type="date"
              value={value ? value.split("T")[0] : ""}
              onChange={(e) => handleInputChange(key, e.target.value || null)}
            />
          </div>
        );

      case "select":
        const selectProperty = rawProperties[key];
        const selectOptions = selectProperty?.select?.options || [];
        // Converter valor vazio/null para undefined para evitar erro do Radix UI
        const selectValue = value && value !== "" ? String(value) : undefined;
        
        // Filtrar opções válidas (não vazias)
        const validOptions = selectOptions.filter((option: any) => 
          option.name && option.name.trim() !== ""
        );
        
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{label}</Label>
            <Select
              value={selectValue}
              onValueChange={(val) => handleInputChange(key, val || null)}
            >
              <SelectTrigger id={key}>
                <SelectValue placeholder={`Selecione ${label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {validOptions.length > 0 ? (
                  validOptions.map((option: any) => {
                    const optionValue = String(option.name).trim();
                    // Garantir que o valor nunca seja vazio
                    if (!optionValue) return null;
                    return (
                      <SelectItem key={option.id || option.name} value={optionValue}>
                        {option.name}
                      </SelectItem>
                    );
                  })
                ) : (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    Nenhuma opção disponível
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        );

      case "multi_select":
        const multiSelectProperty = rawProperties[key];
        const multiSelectOptions = multiSelectProperty?.multi_select?.options || [];
        const currentValues = Array.isArray(value) ? value : [];
        // Para seleção única, pegar o primeiro valor ou null
        const currentValue = currentValues.length > 0 ? currentValues[0] : null;
        
        // Campos específicos que devem ter apenas "sim" ou "não"
        const simNaoFields = [
          "Rio City Tour (extra)",
          "Hike (extra)",
          "Aluguel prancha ilimitado",
          "Carioca Experience (extra)",
          "Include breakfast",
        ];
        
        // Se for um campo sim/não, usar opções fixas
        const isSimNaoField = simNaoFields.includes(key);
        const optionsToUse = isSimNaoField 
          ? [{ name: "sim", id: "sim" }, { name: "não", id: "nao" }]
          : multiSelectOptions;
        
        return (
          <div key={key} className="space-y-2">
            <Label>{label}</Label>
            <div className="space-y-2">
              {optionsToUse.map((option: any) => {
                const optionName = option.name || option;
                const isSelected = currentValue === optionName;
                return (
                  <div key={option.id || optionName} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`${key}-${optionName}`}
                      name={key}
                      checked={isSelected}
                      onChange={(e) => {
                        // Seleção única: substituir o valor anterior
                        const newValue = e.target.checked ? [optionName] : [];
                        handleInputChange(key, newValue);
                      }}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <Label htmlFor={`${key}-${optionName}`} className="cursor-pointer">
                      {optionName}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "phone_number":
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{label}</Label>
            <Input
              id={key}
              type="tel"
              value={value || ""}
              onChange={(e) => handleInputChange(key, e.target.value)}
              placeholder={`Digite ${label.toLowerCase()}`}
            />
          </div>
        );

      case "email":
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{label}</Label>
            <Input
              id={key}
              type="email"
              value={value || ""}
              onChange={(e) => handleInputChange(key, e.target.value)}
              placeholder={`Digite ${label.toLowerCase()}`}
            />
          </div>
        );

      default:
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{label}</Label>
            <Textarea
              id={key}
              value={value ? JSON.stringify(value) : ""}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleInputChange(key, parsed);
                } catch {
                  handleInputChange(key, e.target.value);
                }
              }}
              placeholder={`Digite ${label.toLowerCase()}`}
              rows={3}
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Editar Página do Notion</h1>
        <p className="text-muted-foreground mt-2">
          Page ID: <code className="bg-muted px-2 py-1 rounded text-sm">{pageId}</code>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campos da Página</CardTitle>
          <CardDescription>
            Edite os campos abaixo e clique em "Salvar" para atualizar no Notion via N8N
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredProperties
                .filter(([key]) => key && key.trim() !== "") // Filtrar campos com nome vazio
                .map(([key]) => {
                  const type = propertyTypes[key] || "rich_text";
                  const value = formData[key] !== undefined ? formData[key] : properties[key];
                  return renderField(key, value, type);
                })}
            </div>

            <Separator />

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={isUpdating}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {data.last_edited_time && (
        <Card className="mt-4">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">
              <p>Última edição: {new Date(data.last_edited_time).toLocaleString("pt-BR")}</p>
              <p>Criado em: {new Date(data.created_time).toLocaleString("pt-BR")}</p>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}
