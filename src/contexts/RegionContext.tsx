import { createContext, useContext, ReactNode } from 'react';
import type { Region } from '@/hooks/usePricingConfig';

export type { Region };

// Região da operação em que a tela está. Vem do prefixo da URL:
//   /leads         -> rio    (rotas legadas, sem prefixo)
//   /bahia/leads   -> bahia
//
// Default 'rio' de propósito: qualquer componente que ainda não leia o contexto
// se comporta exatamente como antes.
const RegionCtx = createContext<Region>('rio');

export const RegionProvider = ({ region, children }: { region: Region; children: ReactNode }) => (
  <RegionCtx.Provider value={region}>{children}</RegionCtx.Provider>
);

export const useRegion = () => useContext(RegionCtx);

// Aplica o filtro de região numa query do supabase-js.
// "rio" também aceita region NULL — é como os 916 leads legados estão gravados.
export const applyRegion = <T,>(query: T, region: Region): T =>
  (region === 'rio'
    ? (query as any).or('region.eq.rio,region.is.null')
    : (query as any).eq('region', region)) as T;

// Prefixo de rota da região, pra montar links: `${regionPath(region)}/leads`
export const regionPath = (region: Region) => (region === 'rio' ? '' : `/${region}`);

export const REGION_LABEL: Record<Region, string> = {
  rio: 'Rio de Janeiro',
  bahia: 'Bahia',
};
