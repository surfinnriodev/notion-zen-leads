import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { LeadWithCalculation, calculateLeadPrice } from "@/types/leads";
import { usePricingConfig } from "@/hooks/usePricingConfig";
import { LeadListItem } from "./LeadListItem";
import { FilterOptions, FilterConfig } from "./FilterOptions";
import { SortOptions, SortConfig } from "./SortOptions";

type Lead = Tables<"reservations">;

export const LeadsList = () => {
  console.log("📋 LeadsList component iniciado!");
  const { config } = usePricingConfig();

  // Estados para filtros e ordenação
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'created', direction: 'desc' });
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({ search: '' });

  const { data: leads, isLoading, error: queryError } = useQuery({
    queryKey: ["leads", config],
    queryFn: async () => {
      console.log("🔍 LeadsList fazendo query na tabela reservas...");

      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .order('created_at', { ascending: false });

      console.log("📊 LeadsList resultado:", { data, error, count: data?.length });

      if (error) {
        console.error("❌ LeadsList erro na query:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn("⚠️ LeadsList nenhum lead encontrado");
        return [];
      }

      const leadsWithCalculation: LeadWithCalculation[] = data.map(lead =>
        calculateLeadPrice(lead, config)
      );

      console.log("✅ LeadsList leads processados:", leadsWithCalculation.length);

      return leadsWithCalculation;
    },
  });

  console.log("🔄 LeadsList state:", { leads: leads?.length, isLoading, queryError });

  // Função para filtrar leads
  const filterLeads = (leads: LeadWithCalculation[]) => {
    try {
      let filtered = leads;

      // Busca por texto
      if (filterConfig.search) {
        const search = filterConfig.search.toLowerCase();
        filtered = filtered.filter(lead => {
          const name = lead.name || lead.nome || '';
          const email = lead.email || '';
          const telefone = lead.telefone || lead.phone || '';

          return name.toLowerCase().includes(search) ||
                 email.toLowerCase().includes(search) ||
                 telefone.toLowerCase().includes(search);
        });
      }

      // Filtro por tipo de quarto
      if (filterConfig.room_type) {
        filtered = filtered.filter(lead => lead.tipo_de_quarto === filterConfig.room_type);
      }

      // Filtro por pacote
      if (filterConfig.package) {
        filtered = filtered.filter(lead => lead.pacote === filterConfig.package);
      }

      // Filtro por número de pessoas
      if (filterConfig.min_people) {
        filtered = filtered.filter(lead => {
          const numPeople = lead.number_of_people || lead.numero_de_pessoas || 0;
          return numPeople >= filterConfig.min_people!;
        });
      }
      if (filterConfig.max_people) {
        filtered = filtered.filter(lead => {
          const numPeople = lead.number_of_people || lead.numero_de_pessoas || 0;
          return numPeople <= filterConfig.max_people!;
        });
      }

      // Filtro por email
      if (filterConfig.has_email) {
        filtered = filtered.filter(lead => lead.email && lead.email.trim() !== '');
      }

      // Filtro por telefone
      if (filterConfig.has_phone) {
        filtered = filtered.filter(lead => {
          const phone = lead.telefone || lead.phone || '';
          return phone.trim() !== '';
        });
      }

      return filtered;
    } catch (error) {
      console.error("❌ Error in filterLeads:", error);
      return leads;
    }
  };

  // Função para ordenar leads
  const sortLeads = (leads: LeadWithCalculation[]) => {
    return [...leads].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.field) {
        case 'name':
          aValue = a.name || a.nome || '';
          bValue = b.name || b.nome || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'created':
          aValue = new Date(a.created_at || 0).getTime();
          bValue = new Date(b.created_at || 0).getTime();
          break;
        case 'price':
          aValue = a.totalPrice || 0;
          bValue = b.totalPrice || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Aplicar filtros e ordenação
  const processedLeads = leads ? sortLeads(filterLeads(leads)) : [];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Filtros */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <FilterOptions
            filterConfig={filterConfig}
            onFilterChange={(config) => {
              console.log("🔧 Filter config changed in LeadsList:", config);
              setFilterConfig(config);
            }}
            roomTypes={(() => {
              try {
                const types = leads?.map(l => l.tipo_de_quarto).filter(Boolean) || [];
                return [...new Set(types)];
              } catch (error) {
                console.error("❌ Error extracting room types:", error);
                return [];
              }
            })()}
            packages={(() => {
              try {
                const packages = leads?.map(l => l.pacote).filter(Boolean) || [];
                return [...new Set(packages)];
              } catch (error) {
                console.error("❌ Error extracting packages:", error);
                return [];
              }
            })()}
          />
          <SortOptions
            sortConfig={sortConfig}
            onSortChange={setSortConfig}
          />
        </div>
      </div>

      {/* Lista de leads */}
      <div className="space-y-4">
        {processedLeads.length > 0 ? (
          processedLeads.map((lead) => (
            <LeadListItem key={lead.id} lead={lead} />
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            {filterConfig.search || filterConfig.room_type || filterConfig.package ? (
              <div>
                <div className="text-lg mb-2">Nenhum resultado encontrado</div>
                <div className="text-sm">Tente ajustar os filtros de busca</div>
              </div>
            ) : (
              'Nenhum lead encontrado'
            )}
          </div>
        )}
      </div>
    </div>
  );
};