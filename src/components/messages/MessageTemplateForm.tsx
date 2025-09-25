import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageTemplate, AVAILABLE_VARIABLES } from "@/types/messages";
import { extractVariablesFromText } from "@/utils/messageProcessor";
import { X, Plus } from "lucide-react";

interface MessageTemplateFormProps {
  template?: MessageTemplate | null;
  onSave: (template: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export const MessageTemplateForm = ({ template, onSave, onCancel }: MessageTemplateFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
  });

  const [detectedVariables, setDetectedVariables] = useState<string[]>([]);

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        subject: template.subject,
        content: template.content,
      });
    }
  }, [template]);

  useEffect(() => {
    // Detectar variáveis no assunto e conteúdo
    const subjectVars = extractVariablesFromText(formData.subject);
    const contentVars = extractVariablesFromText(formData.content);
    const allVars = [...new Set([...subjectVars, ...contentVars])];
    setDetectedVariables(allVars);
  }, [formData.subject, formData.content]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.subject.trim() || !formData.content.trim()) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    onSave({
      ...formData,
      variables: detectedVariables,
    });
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.content;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const newText = before + `{{${variable}}}` + after;

      setFormData({ ...formData, content: newText });

      // Reposicionar cursor
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
      }, 10);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {template ? 'Editar Template' : 'Novo Template'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Formulário */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Template *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Mensagem de Boas-vindas"
                  />
                </div>

                <div>
                  <Label htmlFor="subject">Assunto *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Ex: Bem-vindo(a) {{nome}}!"
                  />
                </div>

                <div>
                  <Label htmlFor="content">Conteúdo da Mensagem *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Digite sua mensagem aqui..."
                    className="min-h-[300px]"
                  />
                </div>

                {/* Variáveis Detectadas */}
                {detectedVariables.length > 0 && (
                  <div>
                    <Label>Variáveis Detectadas</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {detectedVariables.map((variable) => (
                        <span
                          key={variable}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                        >
                          {`{{${variable}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Variáveis Disponíveis */}
              <div>
                <Label>Variáveis Disponíveis</Label>
                <div className="mt-2 space-y-2 max-h-[400px] overflow-y-auto border rounded-lg p-3">
                  {AVAILABLE_VARIABLES.map((variable) => (
                    <div
                      key={variable.key}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                      onClick={() => insertVariable(variable.key)}
                    >
                      <div>
                        <div className="font-medium text-sm">{variable.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {`{{${variable.key}}}`} → {variable.example}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          insertVariable(variable.key);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit">
                {template ? 'Salvar Alterações' : 'Criar Template'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};