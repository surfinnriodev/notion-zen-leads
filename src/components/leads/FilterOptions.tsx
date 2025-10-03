import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Filter,
  Search,
  X,
  Calendar,
  User,
  Mail,
  DollarSign,
  Hash,
  Home,
  Package
} from "lucide-react";

export interface FilterConfig {
  search: string;
  room_type?: string;
  package?: string;
  min_people?: number;
  max_people?: number;
  has_email?: boolean;
  has_phone?: boolean;
}

interface FilterOptionsProps {
  filterConfig: FilterConfig;
  onFilterChange: (config: FilterConfig) => void;
  roomTypes: string[];
  packages: string[];
}

export const FilterOptions = ({
  filterConfig,
  onFilterChange,
  roomTypes,
  packages
}: FilterOptionsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: keyof FilterConfig, value: any) => {
    onFilterChange({
      ...filterConfig,
      [key]: value
    });
  };

  const clearFilter = (key: keyof FilterConfig) => {
    const newConfig = { ...filterConfig };
    delete newConfig[key];
    onFilterChange(newConfig);
  };

  const clearAllFilters = () => {
    onFilterChange({ search: '' });
  };

  // Contar filtros ativos (exceto search)
  const activeFiltersCount = Object.keys(filterConfig).filter(
    key => key !== 'search' && filterConfig[key as keyof FilterConfig] != null
  ).length;

  return (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      {/* Busca */}
      <div className="relative flex-1 sm:flex-initial">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar..."
          value={filterConfig.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="pl-9 h-8 sm:w-64 w-full text-sm"
        />
        {filterConfig.search && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => updateFilter('search', '')}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Filtros Avançados */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-muted flex-shrink-0"
          >
            <Filter className="w-3 h-3" />
            {activeFiltersCount > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                {activeFiltersCount}
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80 p-4 max-h-[80vh] overflow-y-auto" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Filtros</h3>
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-xs h-auto p-1"
                >
                  Limpar todos
                </Button>
              )}
            </div>

            {/* Tipo de Quarto */}
            <div className="space-y-2">
              <label className="text-xs font-medium flex items-center gap-2">
                <Home className="w-3 h-3" />
                Tipo de Quarto
              </label>
              <Select
                value={filterConfig.room_type || '__all__'}
                onValueChange={(value) => updateFilter('room_type', value === '__all__' ? undefined : value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Qualquer tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Qualquer tipo</SelectItem>
                  {roomTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pacote */}
            <div className="space-y-2">
              <label className="text-xs font-medium flex items-center gap-2">
                <Package className="w-3 h-3" />
                Pacote
              </label>
              <Select
                value={filterConfig.package || '__all__'}
                onValueChange={(value) => updateFilter('package', value === '__all__' ? undefined : value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Qualquer pacote" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Qualquer pacote</SelectItem>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg} value={pkg}>
                      {pkg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Número de Pessoas */}
            <div className="space-y-2">
              <label className="text-xs font-medium flex items-center gap-2">
                <Hash className="w-3 h-3" />
                Número de Pessoas
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Mín"
                  value={filterConfig.min_people || ''}
                  onChange={(e) => updateFilter('min_people', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="h-8 text-sm"
                />
                <Input
                  type="number"
                  placeholder="Máx"
                  value={filterConfig.max_people || ''}
                  onChange={(e) => updateFilter('max_people', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="has_email"
                  checked={filterConfig.has_email || false}
                  onChange={(e) => updateFilter('has_email', e.target.checked || undefined)}
                  className="w-4 h-4"
                />
                <label htmlFor="has_email" className="text-xs flex items-center gap-2">
                  <Mail className="w-3 h-3" />
                  Tem email
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="has_phone"
                  checked={filterConfig.has_phone || false}
                  onChange={(e) => updateFilter('has_phone', e.target.checked || undefined)}
                  className="w-4 h-4"
                />
                <label htmlFor="has_phone" className="text-xs flex items-center gap-2">
                  <User className="w-3 h-3" />
                  Tem telefone
                </label>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Filtros Ativos */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {filterConfig.room_type && (
            <Badge variant="secondary" className="text-xs gap-1">
              Quarto: {filterConfig.room_type}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => clearFilter('room_type')}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}

          {filterConfig.package && (
            <Badge variant="secondary" className="text-xs gap-1">
              Pacote: {filterConfig.package}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => clearFilter('package')}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}

          {(filterConfig.min_people || filterConfig.max_people) && (
            <Badge variant="secondary" className="text-xs gap-1">
              Pessoas: {filterConfig.min_people || '0'}-{filterConfig.max_people || '∞'}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => {
                  clearFilter('min_people');
                  clearFilter('max_people');
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};