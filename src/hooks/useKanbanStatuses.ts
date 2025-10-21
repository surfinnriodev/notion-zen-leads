import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StatusInfo {
  id: string;
  title: string;
  status: string;
  count: number;
  color: string;
}

export const useKanbanStatuses = () => {
  const [statuses, setStatuses] = useState<StatusInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  console.log('🔍 useKanbanStatuses hook called, current statuses:', statuses);

  useEffect(() => {
    const loadStatuses = async () => {
      try {
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

        // Buscar status únicos dos dados reais
        const { data: statusData } = await supabase
          .from('reservations')
          .select('status')
          .not('status', 'is', null);

        console.log('🔍 Status data from DB:', statusData);

        const statusCounts: Record<string, number> = {};
        statusData?.forEach(item => {
          if (item.status) {
            let status = item.status.trim();
            // Mapear "Lead" para contabilizar na coluna "Novos"
            if (status.toLowerCase() === 'lead') {
              status = 'novo'; // Mapear internamente para novo
            }
            statusCounts[status] = (statusCounts[status] || 0) + 1;
          }
        });

        console.log('📊 Status counts:', statusCounts);

        // Buscar leads sem status
        const { count: noStatusCount } = await supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .or('status.is.null,status.eq.');

        const getStatusColor = (index: number) => {
          const colors = [
            "#6B7280", "#EF4444", "#F97316", "#EAB308", "#22C55E",
            "#06B6D4", "#3B82F6", "#8B5CF6", "#EC4899",
            "#F43F5E", "#84CC16", "#10B981", "#6366F1"
          ];
          return colors[index % colors.length];
        };

        const statusList: StatusInfo[] = [];
        
        // Primeiro, adicionar status na ordem padrão
        defaultStatusOrder.forEach((statusName, index) => {
          let count = 0;
          let statusId = statusName.toLowerCase().replace(/[^a-z0-9]/g, '-');
          
          if (statusName === 'novo') {
            count = (noStatusCount || 0) + (statusCounts['novo'] || 0);
            statusId = 'novo';
          } else {
            // Buscar por variações do nome do status
            const matchingStatus = Object.keys(statusCounts).find(key => 
              key.toLowerCase().includes(statusName.toLowerCase()) ||
              statusName.toLowerCase().includes(key.toLowerCase())
            );
            if (matchingStatus) {
              count = statusCounts[matchingStatus];
            }
          }
          
          statusList.push({
            id: statusId,
            title: statusName,
            status: statusName,
            count: count,
            color: getStatusColor(index)
          });
        });

        // Depois, adicionar outros status encontrados nos dados que não estão na ordem padrão
        Object.entries(statusCounts).forEach(([status, count], index) => {
          const normalizedStatus = status.toLowerCase().replace(/[^a-z0-9]/g, '-');
          const alreadyAdded = statusList.some(col => 
            col.status.toLowerCase().includes(status.toLowerCase()) ||
            status.toLowerCase().includes(col.status.toLowerCase())
          );
          
          if (!alreadyAdded && status !== 'novo') {
            statusList.push({
              id: normalizedStatus,
              title: status,
              status: status,
              count: count,
              color: getStatusColor(statusList.length)
            });
          }
        });

        console.log('✅ Final status list:', statusList);
        
        // Garantir que sempre temos pelo menos os status padrão
        if (statusList.length === 0) {
          console.log('⚠️ Status list is empty, using fallback');
          const fallbackStatuses = [
            { id: "novo", title: "Novos", status: "novo", count: 0, color: "#6B7280" },
            { id: "duvidas", title: "Dúvidas", status: "dúvidas", count: 0, color: "#EF4444" },
            { id: "orcamento-enviado", title: "Orçamento Enviado", status: "orçamento enviado", count: 0, color: "#F97316" },
            { id: "fup-1", title: "FUP 1", status: "fup 1", count: 0, color: "#EAB308" },
            { id: "link-de-pagamento-enviado", title: "Link de Pagamento Enviado", status: "link de pagamento enviado", count: 0, color: "#22C55E" },
            { id: "pago-a-se-hospedar", title: "Pago | A se Hospedar", status: "pago | a se hospedar", count: 0, color: "#10B981" },
            { id: "perdido", title: "Perdido", status: "perdido", count: 0, color: "#F43F5E" },
            { id: "hospedagem-concluida", title: "Hospedagem Concluída", status: "hospedagem concluída", count: 0, color: "#6366F1" },
          ];
          setStatuses(fallbackStatuses);
        } else {
          setStatuses(statusList);
        }
      } catch (error) {
        console.error('❌ Erro ao carregar status do kanban:', error);
        // Fallback para status padrão
        const fallbackStatuses = [
          { id: "novo", title: "Novos", status: "novo", count: 0, color: "#6B7280" },
          { id: "duvidas", title: "Dúvidas", status: "dúvidas", count: 0, color: "#EF4444" },
          { id: "orcamento-enviado", title: "Orçamento Enviado", status: "orçamento enviado", count: 0, color: "#F97316" },
          { id: "fup-1", title: "FUP 1", status: "fup 1", count: 0, color: "#EAB308" },
          { id: "link-de-pagamento-enviado", title: "Link de Pagamento Enviado", status: "link de pagamento enviado", count: 0, color: "#22C55E" },
          { id: "pago-a-se-hospedar", title: "Pago | A se Hospedar", status: "pago | a se hospedar", count: 0, color: "#10B981" },
          { id: "perdido", title: "Perdido", status: "perdido", count: 0, color: "#F43F5E" },
          { id: "hospedagem-concluida", title: "Hospedagem Concluída", status: "hospedagem concluída", count: 0, color: "#6366F1" },
        ];
        console.log('🔄 Using fallback statuses:', fallbackStatuses);
        setStatuses(fallbackStatuses);
      } finally {
        setIsLoading(false);
      }
    };

    loadStatuses();
  }, []);

  return { statuses, isLoading };
};
