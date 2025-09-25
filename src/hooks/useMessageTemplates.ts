import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MessageTemplate, MessageTemplateInsert, MessageTemplateUpdate } from '@/types/database';
import { toast } from 'sonner';

export const useMessageTemplates = () => {
  const queryClient = useQueryClient();

  // Buscar templates
  const { data: templates = [], isLoading, error } = useQuery({
    queryKey: ['message-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MessageTemplate[];
    },
  });

  // Adicionar template
  const addTemplateMutation = useMutation({
    mutationFn: async (template: MessageTemplateInsert) => {
      const { data, error } = await supabase
        .from('message_templates')
        .insert(template)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
      toast.success('Template criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar template: ' + error.message);
    },
  });

  // Atualizar template
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: MessageTemplateUpdate }) => {
      const { data, error } = await supabase
        .from('message_templates')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
      toast.success('Template atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar template: ' + error.message);
    },
  });

  // Deletar template (soft delete)
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('message_templates')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
      toast.success('Template removido com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao remover template: ' + error.message);
    },
  });

  // Funções wrapper para compatibilidade
  const addTemplate = (template: Omit<MessageTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    addTemplateMutation.mutate(template);
  };

  const updateTemplate = (id: string, updates: Partial<Omit<MessageTemplate, 'id' | 'created_at' | 'updated_at'>>) => {
    updateTemplateMutation.mutate({ id, updates });
  };

  const deleteTemplate = (id: string) => {
    deleteTemplateMutation.mutate(id);
  };

  const resetToDefault = () => {
    // Esta função pode ser implementada se necessário
    toast.info('Função de reset será implementada em breve');
  };

  return {
    templates,
    isLoading,
    error,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    resetToDefault,
    // Expor mutations para controle mais fino
    addTemplateMutation,
    updateTemplateMutation,
    deleteTemplateMutation,
  };
};