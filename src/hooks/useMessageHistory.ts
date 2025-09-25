import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MessageHistory, MessageHistoryInsert, MessageStats } from '@/types/database';
import { toast } from 'sonner';

export const useMessageHistory = (leadId?: number) => {
  const queryClient = useQueryClient();

  // Buscar histórico de mensagens
  const { data: messages = [], isLoading, error } = useQuery({
    queryKey: ['message-history', leadId],
    queryFn: async () => {
      let query = supabase
        .from('message_history')
        .select(`
          *,
          message_templates(name),
          reservations(name, email)
        `)
        .order('sent_at', { ascending: false });

      if (leadId) {
        query = query.eq('lead_id', leadId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as MessageHistory[];
    },
    enabled: true, // Sempre buscar, mesmo sem leadId
  });

  // Adicionar mensagem ao histórico
  const addMessageMutation = useMutation({
    mutationFn: async (messageData: MessageHistoryInsert) => {
      const { data, error } = await supabase
        .from('message_history')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-history'] });
      toast.success('Mensagem registrada no histórico!');
    },
    onError: (error) => {
      toast.error('Erro ao registrar mensagem: ' + error.message);
    },
  });

  // Buscar estatísticas de mensagens
  const { data: stats } = useQuery({
    queryKey: ['message-stats'],
    queryFn: async (): Promise<MessageStats> => {
      const { data, error } = await supabase
        .from('message_history')
        .select('*');

      if (error) throw error;

      const totalSent = data.length;
      const byTemplate: Record<string, number> = {};
      const byType: Record<string, number> = {};

      data.forEach((message) => {
        // Contar por template
        if (message.template_id) {
          byTemplate[message.template_id] = (byTemplate[message.template_id] || 0) + 1;
        }

        // Contar por tipo
        byType[message.message_type] = (byType[message.message_type] || 0) + 1;
      });

      return {
        totalSent,
        byTemplate,
        byType,
        recentMessages: data.slice(0, 10), // Últimas 10 mensagens
      };
    },
  });

  // Funções wrapper
  const addMessage = (messageData: MessageHistoryInsert) => {
    addMessageMutation.mutate(messageData);
  };

  const getMessagesForLead = (leadId: number) => {
    return messages.filter(msg => msg.lead_id === leadId);
  };

  return {
    messages,
    stats,
    isLoading,
    error,
    addMessage,
    getMessagesForLead,
    addMessageMutation,
  };
};
