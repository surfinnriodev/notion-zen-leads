import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageTemplate } from "@/types/messages";
import { processTemplate } from "@/utils/messageProcessor";
import { X } from "lucide-react";

// Lead de exemplo para preview
const SAMPLE_LEAD = {
  id: 1,
  name: "João Silva",
  email: "joao@email.com",
  telefone: "(21) 99999-9999",
  check_in_start: "2024-12-15",
  check_in_end: "2024-12-20",
  number_of_people: 2,
  tipo_de_quarto: "Private: Double",
  pacote: "Pacote Completo",
  status: "Lead",
  nivel_de_surf: "Iniciante",
  obs_do_cliente: "Interesse em aulas de yoga",
  totalPrice: 2500,
  accommodationCost: 1200,
  packageCost: 500,
} as any;

interface MessagePreviewDialogProps {
  template: MessageTemplate;
  onClose: () => void;
}

export const MessagePreviewDialog = ({ template, onClose }: MessagePreviewDialogProps) => {
  const preview = processTemplate(template, SAMPLE_LEAD);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Preview: {template.name}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Original */}
          <div>
            <h3 className="font-medium mb-3 text-sm text-muted-foreground">TEMPLATE ORIGINAL</h3>
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">ASSUNTO:</div>
                <div className="font-mono text-sm">{template.subject}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">MENSAGEM:</div>
                <div className="font-mono text-sm whitespace-pre-wrap">{template.content}</div>
              </div>
            </div>
          </div>

          {/* Preview Processado */}
          <div>
            <h3 className="font-medium mb-3 text-sm text-muted-foreground">
              PREVIEW COM DADOS DE EXEMPLO
            </h3>
            <div className="space-y-3 p-4 border rounded-lg bg-white">
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">ASSUNTO:</div>
                <div className="font-medium">{preview.subject}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">MENSAGEM:</div>
                <div className="whitespace-pre-wrap">{preview.content}</div>
              </div>
            </div>
          </div>

          {/* Variáveis Utilizadas */}
          <div>
            <h3 className="font-medium mb-3 text-sm text-muted-foreground">
              VARIÁVEIS UTILIZADAS ({Object.keys(preview.variables).length})
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(preview.variables).map(([key, value]) => (
                <div key={key} className="p-3 bg-blue-50 rounded-lg">
                  <div className="font-mono text-xs text-blue-600 mb-1">
                    {`{{${key}}}`}
                  </div>
                  <div className="text-sm">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Botão Fechar */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};