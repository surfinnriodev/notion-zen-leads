import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Plus, Trash2, Edit2, Check, X, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface StatusInfo {
  id: string;
  title: string;
  status: string;
  count: number;
  color?: string;
}

interface StatusManagerProps {
  onStatusChange?: (newStatuses: StatusInfo[]) => void;
}

export const StatusManager = ({ onStatusChange }: StatusManagerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [statuses, setStatuses] = useState<StatusInfo[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [newStatusTitle, setNewStatusTitle] = useState("");

  // Query para buscar todos os status existentes nos dados
  const { data: statusData, refetch } = useQuery({
    queryKey: ["status-analysis"],
    queryFn: async () => {
      // Buscar todos os status únicos
      const { data: statusData, error } = await supabase
        .from('reservations')
        .select('status')
        .not('status', 'is', null);

      if (error) throw error;

      // Contar ocorrências
      const statusCounts: Record<string, number> = {};
      statusData.forEach(item => {
        if (item.status) {
          const status = item.status.trim();
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        }
      });

      // Buscar leads sem status
      const { count: noStatusCount } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .or('status.is.null,status.eq.');

      return { statusCounts, noStatusCount: noStatusCount || 0 };
    },
    enabled: isOpen
  });

  // Carregar configurações salvas ou usar dados reais
  useEffect(() => {
    if (statusData) {
      // Sempre usar ordem padrão - não carregar configuração salva
      let defaultStatuses: StatusInfo[] = [];
        // Ordem padrão dos status conforme solicitado
        const defaultStatusOrder = [
          'novo',
          'dúvidas',
          'orçamento enviado',
          'fup 1',
          'link de pagamento enviado',
          'pago | a se hospedar',
          'perdido',
          'hospedagem concluída'
        ];

        defaultStatuses = [];
        
        // Primeiro, adicionar status na ordem padrão
        defaultStatusOrder.forEach((statusName, index) => {
          let count = 0;
          let statusId = statusName.toLowerCase().replace(/[^a-z0-9]/g, '-');
          
          if (statusName === 'novo') {
            count = statusData.noStatusCount;
            statusId = 'novo';
          } else {
            // Buscar por variações do nome do status
            const matchingStatus = Object.keys(statusData.statusCounts).find(key => 
              key.toLowerCase().includes(statusName.toLowerCase()) ||
              statusName.toLowerCase().includes(key.toLowerCase())
            );
            if (matchingStatus) {
              count = statusData.statusCounts[matchingStatus];
            }
          }
          
          defaultStatuses.push({
            id: statusId,
            title: statusName,
            status: statusName,
            count: count,
            color: getStatusColor(index)
          });
        });

        // Depois, adicionar outros status encontrados nos dados que não estão na ordem padrão
        Object.entries(statusData.statusCounts).forEach(([status, count], index) => {
          const normalizedStatus = status.toLowerCase().replace(/[^a-z0-9]/g, '-');
          const alreadyAdded = defaultStatuses.some(col => 
            col.status.toLowerCase().includes(status.toLowerCase()) ||
            status.toLowerCase().includes(col.status.toLowerCase())
          );
          
          if (!alreadyAdded && status !== 'novo') {
            defaultStatuses.push({
              id: normalizedStatus,
              title: status,
              status: status,
              count: count,
              color: getStatusColor(defaultStatuses.length)
            });
          }
        });
      }

      setStatuses(defaultStatuses);
    }
  }, [statusData]);

  const getStatusColor = (index: number) => {
    const colors = [
      "#EF4444", "#F97316", "#EAB308", "#22C55E",
      "#06B6D4", "#3B82F6", "#8B5CF6", "#EC4899",
      "#F43F5E", "#84CC16", "#10B981", "#6366F1"
    ];
    return colors[index % colors.length];
  };

  const saveStatusConfig = (newStatuses: StatusInfo[]) => {
    localStorage.setItem('leads-status-config', JSON.stringify(newStatuses));
    onStatusChange?.(newStatuses);
    toast.success("Configuração de status atualizada!");
  };

  const handleEditStatus = (id: string, newTitle: string) => {
    if (!newTitle.trim()) {
      toast.error("O título não pode estar vazio");
      return;
    }

    const updatedStatuses = statuses.map(status =>
      status.id === id ? { ...status, title: newTitle.trim() } : status
    );

    setStatuses(updatedStatuses);
    saveStatusConfig(updatedStatuses);
    setEditingId(null);
    setEditTitle("");
  };

  const handleAddStatus = () => {
    if (!newStatusTitle.trim()) {
      toast.error("Digite um nome para o status");
      return;
    }

    const newStatus: StatusInfo = {
      id: newStatusTitle.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now(),
      title: newStatusTitle.trim(),
      status: newStatusTitle.trim(),
      count: 0,
      color: getStatusColor(statuses.length)
    };

    const updatedStatuses = [...statuses, newStatus];
    setStatuses(updatedStatuses);
    saveStatusConfig(updatedStatuses);
    setNewStatusTitle("");
    toast.success(`Status "${newStatus.title}" adicionado!`);
  };

  const handleRemoveStatus = (id: string) => {
    const statusToRemove = statuses.find(s => s.id === id);
    if (statusToRemove && statusToRemove.count > 0) {
      toast.error(`Não é possível remover "${statusToRemove.title}" pois há ${statusToRemove.count} leads com esse status`);
      return;
    }

    const updatedStatuses = statuses.filter(s => s.id !== id);
    setStatuses(updatedStatuses);
    saveStatusConfig(updatedStatuses);
    toast.success(`Status removido!`);
  };

  const startEdit = (status: StatusInfo) => {
    setEditingId(status.id);
    setEditTitle(status.title);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="w-4 h-4" />
          Gerenciar Status
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Status dos Leads</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lista de Status Existentes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Status Atuais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {statuses.map((status) => (
                <div key={status.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />

                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />

                    {editingId === status.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="h-8"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditStatus(status.id, editTitle);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditStatus(status.id, editTitle)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEdit}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="font-medium truncate">{status.title}</span>
                        <Badge variant="secondary" className="flex-shrink-0">
                          {status.count} leads
                        </Badge>
                      </div>
                    )}
                  </div>

                  {editingId !== status.id && (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(status)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {status.count === 0 && status.id !== "novo" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveStatus(status.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Adicionar Novo Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Adicionar Novo Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Nome do novo status..."
                  value={newStatusTitle}
                  onChange={(e) => setNewStatusTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddStatus();
                  }}
                />
                <Button onClick={handleAddStatus} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Estatísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total de status:</span>
                  <span className="ml-2 font-medium">{statuses.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total de leads:</span>
                  <span className="ml-2 font-medium">
                    {statuses.reduce((acc, status) => acc + status.count, 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Fechar
            </Button>
            <Button onClick={() => {
              refetch();
              toast.success("Status atualizados!");
            }}>
              Recarregar Dados
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};