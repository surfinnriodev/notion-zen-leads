import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PricingConfig, PricingConfigInsert, PricingConfigUpdate, PricingConfigData } from '@/types/database';
import { PricingItem } from '@/types/pricing';
import { toast } from 'sonner';

// Todos os itens de cobrança disponíveis baseados no banco
export const AVAILABLE_PRICING_ITEMS: PricingItem[] = [
  // Itens diários/booleanos
  { id: 'breakfast', name: 'Café da manhã', price: 30, billingType: 'per_person', category: 'boolean', dbColumn: 'breakfast' },
  { id: 'aluguel_prancha', name: 'Aluguel prancha', price: 100, billingType: 'per_person', category: 'boolean', dbColumn: 'aluguel_de_prancha' },
  { id: 'transfer', name: 'Transfer', price: 300, billingType: 'per_reservation', category: 'boolean', dbColumn: 'transfer' },
  { id: 'transfer_extra', name: 'Transfer extra', price: 300, billingType: 'per_reservation', category: 'boolean', dbColumn: 'transfer_extra' },
  { id: 'massagem_extra', name: 'Massagem extra', price: 250, billingType: 'per_person', category: 'boolean', dbColumn: 'massagem_extra' },
  { id: 'rio_city_tour', name: 'Rio City Tour', price: 700, billingType: 'per_person', category: 'boolean', dbColumn: 'rio_city_tour' },
  { id: 'carioca_experience', name: 'Carioca Experience', price: 840, billingType: 'per_person', category: 'boolean', dbColumn: 'carioca_experience' },
  { id: 'hike_extra', name: 'Trilha extra', price: 300, billingType: 'per_person', category: 'boolean', dbColumn: 'hike_extra' },

  // Itens numéricos (quantidade) - Aulas de surf com faixas de preço (não editável individualmente)
  // { id: 'aulas_de_surf', name: 'Aulas de surf', price: 180, billingType: 'per_person', category: 'fixed', dbColumn: 'aulas_de_surf' },
  { id: 'aulas_de_yoga', name: 'Aulas de yoga', price: 120, billingType: 'per_person', category: 'fixed', dbColumn: 'aulas_de_yoga' },
  { id: 'yoga', name: 'Yoga individual', price: 120, billingType: 'per_person', category: 'fixed', dbColumn: 'yoga' },
  { id: 'skate', name: 'Surf-skate', price: 160, billingType: 'per_person', category: 'fixed', dbColumn: 'skate' },
  { id: 'surf_guide', name: 'Surf guide', price: 350, billingType: 'per_person', category: 'fixed', dbColumn: 'surf_guide' },
  { id: 'surf_guide_package', name: 'Surf guide (pacote)', price: 350, billingType: 'per_person', category: 'fixed', dbColumn: 'surf_guide_package' },
  { id: 'analise_de_video', name: 'Análise de vídeo', price: 350, billingType: 'per_person', category: 'fixed', dbColumn: 'analise_de_video' },
  { id: 'analise_de_video_package', name: 'Análise vídeo (pacote)', price: 350, billingType: 'per_person', category: 'fixed', dbColumn: 'analise_de_video_package' },
  { id: 'massagem_package', name: 'Massagem (pacote)', price: 250, billingType: 'per_person', category: 'fixed', dbColumn: 'massagem_package' },
  { id: 'transfer_package', name: 'Transfer (pacote)', price: 300, billingType: 'per_reservation', category: 'fixed', dbColumn: 'transfer_package' },
];

export const usePricingConfig = () => {
  const queryClient = useQueryClient();

  // Buscar configuração ativa
  const { data: config, isLoading, error } = useQuery({
    queryKey: ['pricing-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_config')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // Se não encontrar configuração ativa, buscar a primeira disponível
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('pricing_config')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (fallbackError) throw fallbackError;
        return fallbackData;
      }

      return data;
    },
  });

  // Configuração padrão para fallback
  const DEFAULT_CONFIG_DATA: PricingConfigData = {
    roomCategories: [
      { id: 'private-double', name: 'Private: Double', pricePerNight: 150, billingType: 'per_room' },
      { id: 'private-single', name: 'Private: Single', pricePerNight: 120, billingType: 'per_room' },
      { id: 'shared-mixed', name: 'Shared: Mixed Standard', pricePerNight: 80, billingType: 'per_person' },
      { id: 'shared-female', name: 'Shared: Female Only', pricePerNight: 85, billingType: 'per_person' },
    ],
    surfLessonPricing: {
      tier1: 180, // 1-3 aulas
      tier2: 160, // 4-7 aulas
      tier3: 140, // 8+ aulas
    },
    packages: [
      {
        id: 'basic-package',
        name: 'Pacote Básico',
        fixedPrice: 300,
        overridesIndividualPricing: true,
        includedItems: {
          breakfast: true,
          unlimitedBoardRental: true,
          surfLessons: 2,
        }
      },
      {
        id: 'complete-package',
        name: 'Pacote Completo',
        fixedPrice: 500,
        overridesIndividualPricing: true,
        includedItems: {
          breakfast: true,
          unlimitedBoardRental: true,
          surfLessons: 5,
          yogaLessons: 3,
          surfSkate: 2,
          videoAnalysis: 1,
        }
      }
    ],
    items: [
      // Itens diários/booleanos
      { id: 'breakfast', name: 'Café da manhã', price: 30, billingType: 'per_person', category: 'boolean', dbColumn: 'breakfast' },
      { id: 'aluguel_prancha', name: 'Aluguel prancha', price: 100, billingType: 'per_person', category: 'boolean', dbColumn: 'aluguel_de_prancha' },
      { id: 'transfer', name: 'Transfer', price: 300, billingType: 'per_reservation', category: 'boolean', dbColumn: 'transfer' },
      { id: 'transfer_extra', name: 'Transfer extra', price: 300, billingType: 'per_reservation', category: 'boolean', dbColumn: 'transfer_extra' },
      { id: 'massagem_extra', name: 'Massagem extra', price: 250, billingType: 'per_person', category: 'boolean', dbColumn: 'massagem_extra' },
      { id: 'rio_city_tour', name: 'Rio City Tour', price: 700, billingType: 'per_person', category: 'boolean', dbColumn: 'rio_city_tour' },
      { id: 'carioca_experience', name: 'Carioca Experience', price: 840, billingType: 'per_person', category: 'boolean', dbColumn: 'carioca_experience' },
      { id: 'hike_extra', name: 'Trilha extra', price: 300, billingType: 'per_person', category: 'boolean', dbColumn: 'hike_extra' },

      // Itens numéricos (quantidade) - Aulas de surf com faixas de preço (não editável individualmente)
      // { id: 'aulas_de_surf', name: 'Aulas de surf', price: 180, billingType: 'per_person', category: 'fixed', dbColumn: 'aulas_de_surf' },
      { id: 'aulas_de_yoga', name: 'Aulas de yoga', price: 120, billingType: 'per_person', category: 'fixed', dbColumn: 'aulas_de_yoga' },
      { id: 'yoga', name: 'Yoga individual', price: 120, billingType: 'per_person', category: 'fixed', dbColumn: 'yoga' },
      { id: 'skate', name: 'Surf-skate', price: 160, billingType: 'per_person', category: 'fixed', dbColumn: 'skate' },
      { id: 'surf_guide', name: 'Surf guide', price: 350, billingType: 'per_person', category: 'fixed', dbColumn: 'surf_guide' },
      { id: 'surf_guide_package', name: 'Surf guide (pacote)', price: 350, billingType: 'per_person', category: 'fixed', dbColumn: 'surf_guide_package' },
      { id: 'analise_de_video', name: 'Análise de vídeo', price: 350, billingType: 'per_person', category: 'fixed', dbColumn: 'analise_de_video' },
      { id: 'analise_de_video_package', name: 'Análise vídeo (pacote)', price: 350, billingType: 'per_person', category: 'fixed', dbColumn: 'analise_de_video_package' },
      { id: 'massagem_package', name: 'Massagem (pacote)', price: 250, billingType: 'per_person', category: 'fixed', dbColumn: 'massagem_package' },
      { id: 'transfer_package', name: 'Transfer (pacote)', price: 300, billingType: 'per_reservation', category: 'fixed', dbColumn: 'transfer_package' },
    ]
  };

  // Converter dados do banco para o formato esperado (memoizado para evitar loops)
  const parsedConfig: PricingConfigData = useMemo(() => {
    return config ? {
      roomCategories: config.room_categories as any,
      packages: config.packages as any,
      items: config.items as any,
      surfLessonPricing: config.surf_lesson_pricing as any || DEFAULT_CONFIG_DATA.surfLessonPricing,
    } : DEFAULT_CONFIG_DATA;
  }, [config]);

  // Atualizar configuração
  const updateConfigMutation = useMutation({
    mutationFn: async (newConfig: PricingConfigData) => {
      if (!config) {
        // Criar nova configuração
        const { data, error } = await supabase
          .from('pricing_config')
          .insert({
            name: 'Configuração Atualizada',
            description: 'Configuração de preços atualizada',
            room_categories: newConfig.roomCategories,
            packages: newConfig.packages,
            items: newConfig.items,
            surf_lesson_pricing: newConfig.surfLessonPricing,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Atualizar configuração existente
        const { data, error } = await supabase
          .from('pricing_config')
          .update({
            room_categories: newConfig.roomCategories,
            packages: newConfig.packages,
            items: newConfig.items,
            surf_lesson_pricing: newConfig.surfLessonPricing,
            updated_at: new Date().toISOString(),
          })
          .eq('id', config.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-config'] });
      toast.success('Configuração de preços atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar configuração: ' + error.message);
    },
  });

  // Criar nova configuração
  const createConfigMutation = useMutation({
    mutationFn: async (configData: PricingConfigInsert) => {
      const { data, error } = await supabase
        .from('pricing_config')
        .insert(configData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-config'] });
      toast.success('Nova configuração criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar configuração: ' + error.message);
    },
  });

  // Funções wrapper para compatibilidade
  const updateConfig = (newConfig: Partial<PricingConfigData>) => {
    const updatedConfig = {
      ...parsedConfig,
      ...newConfig,
    };
    
    updateConfigMutation.mutate(updatedConfig);
  };

  const resetToDefault = () => {
    // Implementar reset para configuração padrão se necessário
    toast.info('Função de reset será implementada em breve');
  };

  return {
    config: parsedConfig,
    isLoading,
    error,
    updateConfig,
    resetToDefault,
    // Expor mutations para controle mais fino
    updateConfigMutation,
    createConfigMutation,
  };
};