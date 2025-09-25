import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit3, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { LeadWithCalculation } from "@/types/leads";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface StatusInfo {
  id: string;
  title: string;
  status: string;
  count: number;
  color?: string;
}

interface BulkStatusEditorProps {
  leads: LeadWithCalculation[];
  statuses: StatusInfo[];
}

export const BulkStatusEditor = ({ leads, statuses }: BulkStatusEditorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [fromStatus, setFromStatus] = useState<string>("");
  const [toStatus, setToStatus] = useState<string>("");
  const queryClient = useQueryClient();

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ fromStatus, toStatus }: { fromStatus: string, toStatus: string }) => {
      // Determinar a condição WHERE baseada no status de origem
      let query = supabase.from("reservations");

      if (fromStatus === "novo") {
        // Status "novo" = null ou string vazia no banco
        query = query.update({ status: toStatus === "novo" ? null : toStatus })
          .or('status.is.null,status.eq.');
      } else {
        // Status específico
        query = query.update({ status: toStatus === "novo" ? null : toStatus })
          .eq('status', fromStatus);
      }

      const { data, error } = await query.select('id');

      if (error) throw error;
      return { affectedCount: data?.length || 0, fromStatus, toStatus };
    },
    onSuccess: ({ affectedCount, fromStatus, toStatus }) => {
      queryClient.invalidateQueries({ queryKey: ["leads-board"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["status-analysis"] });

      const fromStatusName = statuses.find(s => s.status === fromStatus)?.title || fromStatus;
      const toStatusName = statuses.find(s => s.status === toStatus)?.title || (toStatus === "novo" ? "Novo" : toStatus);

      toast.success(`${affectedCount} leads movidos de "${fromStatusName}" para "${toStatusName}"!`);
      setFromStatus("");
      setToStatus("");
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar leads: " + error.message);
    },
  });

  const handleBulkUpdate = () => {
    if (!fromStatus) {
      toast.error("Selecione o status de origem");
      return;
    }

    if (!toStatus) {
      toast.error("Selecione o status de destino");
      return;
    }

    if (fromStatus === toStatus) {
      toast.error("Status de origem e destino devem ser diferentes");
      return;
    }

    bulkUpdateMutation.mutate({ fromStatus, toStatus });
  };

  // Contar quantos leads há no status selecionado
  const getLeadsCount = (statusValue: string) => {
    if (statusValue === "novo") {
      return leads.filter(lead => !lead.status || lead.status === "").length;
    }
    return leads.filter(lead => lead.status === statusValue).length;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Edit3 className="w-4 h-4" />
          Editar em Lote
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Editar Status em Lote
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Seletor Status de Origem */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Mover todos os leads de:</label>
            <Select value={fromStatus} onValueChange={setFromStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status atual..." />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => {
                  const count = getLeadsCount(status.status);
                  return (
                    <SelectItem key={status.id} value={status.status}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          {status.color && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: status.color }}
                            />
                          )}
                          {status.title}
                        </div>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {count}
                        </Badge>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Seta */}
          {fromStatus && (
            <div className="flex justify-center py-2">
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>
          )}

          {/* Seletor Status de Destino */}
          {fromStatus && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Para:</label>
              <Select value={toStatus} onValueChange={setToStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o novo status..." />
                </SelectTrigger>
                <SelectContent>
                  {statuses
                    .filter(s => s.status !== fromStatus)
                    .map((status) => (
                      <SelectItem key={status.id} value={status.status}>
                        <div className="flex items-center gap-2">
                          {status.color && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: status.color }}
                            />
                          )}
                          {status.title}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Resumo da Ação */}
          {fromStatus && toStatus && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                Isso moverá <strong>{getLeadsCount(fromStatus)} leads</strong> de{' '}
                <strong>"{statuses.find(s => s.status === fromStatus)?.title}"</strong> para{' '}
                <strong>"{statuses.find(s => s.status === toStatus)?.title}"</strong>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                setFromStatus("");
                setToStatus("");
              }}
            >
              Cancelar
            </Button>

            <Button
              onClick={handleBulkUpdate}
              disabled={!fromStatus || !toStatus || bulkUpdateMutation.isPending}
            >
              {bulkUpdateMutation.isPending ? "Movendo..." : "Mover Leads"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};