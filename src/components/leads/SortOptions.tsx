import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  User,
  Mail,
  DollarSign,
  Hash,
  Clock
} from "lucide-react";

export type SortField = 'name' | 'email' | 'created' | 'checkin' | 'price' | 'people' | 'updated';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

interface SortOptionsProps {
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig) => void;
}

const sortOptions = [
  { value: 'updated', label: 'Última atualização', icon: Clock },
  { value: 'name', label: 'Nome', icon: User },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'created', label: 'Data de Criação', icon: Calendar },
  { value: 'checkin', label: 'Check-in', icon: Calendar },
  { value: 'price', label: 'Preço', icon: DollarSign },
  { value: 'people', label: 'Nº Pessoas', icon: Hash },
] as const;

export const SortOptions = ({ sortConfig, onSortChange }: SortOptionsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDirection = () => {
    onSortChange({
      ...sortConfig,
      direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const handleFieldChange = (field: string) => {
    onSortChange({
      field: field as SortField,
      direction: 'asc'
    });
  };

  const currentOption = sortOptions.find(opt => opt.value === sortConfig.field);
  const Icon = currentOption?.icon || ArrowUpDown;

  return (
    <div className="flex items-center gap-1">
      {/* Seletor de Campo */}
      <Select value={sortConfig.field} onValueChange={handleFieldChange}>
        <SelectTrigger className="w-auto h-8 text-xs border-0 shadow-none gap-1 bg-transparent hover:bg-muted">
          <div className="flex items-center gap-1.5">
            <Icon className="w-3 h-3" />
            <span className="hidden sm:inline">{currentOption?.label || 'Ordenar'}</span>
          </div>
        </SelectTrigger>
        <SelectContent align="end" className="w-48">
          {sortOptions.map((option) => {
            const OptionIcon = option.icon;
            return (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <OptionIcon className="w-4 h-4" />
                  {option.label}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {/* Botão de Direção */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 hover:bg-muted"
        onClick={toggleDirection}
        title={sortConfig.direction === 'asc' ? 'Ordem crescente' : 'Ordem decrescente'}
      >
        {sortConfig.direction === 'asc' ? (
          <ArrowUp className="w-3 h-3" />
        ) : (
          <ArrowDown className="w-3 h-3" />
        )}
      </Button>
    </div>
  );
};