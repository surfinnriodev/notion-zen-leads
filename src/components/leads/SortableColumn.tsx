import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { LeadWithCalculation } from "@/types/leads";
import { DraggableLeadCard } from "./DraggableLeadCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit2, Check, X, GripVertical, Plus } from "lucide-react";
import { useState } from "react";
// DropdownMenu removido - interface simplificada

interface StatusInfo {
  id: string;
  title: string;
  status: string;
  count: number;
  color?: string;
}

interface SortableColumnProps {
  column: StatusInfo;
  leads: LeadWithCalculation[];
  onTitleEdit?: (newTitle: string) => void;
  onAddCard?: () => void;
  onDeleteColumn?: () => void;
  isEditing?: boolean;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
}

export const SortableColumn = ({
  column,
  leads,
  onTitleEdit,
  onAddCard,
  onDeleteColumn,
  isEditing,
  onStartEdit,
  onCancelEdit
}: SortableColumnProps) => {
  const [editTitle, setEditTitle] = useState(column.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const { setNodeRef: setDropNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSaveTitle = () => {
    if (editTitle.trim() && onTitleEdit) {
      onTitleEdit(editTitle.trim());
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(column.title);
    onCancelEdit?.();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-shrink-0 w-[300px] lg:w-[320px]"
    >
      <div className="h-full flex flex-col">
        {/* Header da Coluna - Estilo Notion */}
        <div className="flex items-center gap-2 mb-3 group">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>

          {/* Cor do Status */}
          {column.color && (
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: column.color }}
            />
          )}

          {/* Título Editável */}
          {isEditing ? (
            <div className="flex items-center gap-1 flex-1">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="h-7 text-sm font-medium border-0 shadow-none p-0 focus-visible:ring-0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
                autoFocus
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                onClick={handleSaveTitle}
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                onClick={handleCancelEdit}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <>
              <h3
                className="font-medium text-sm text-foreground truncate flex-1 cursor-pointer hover:bg-muted px-2 py-1 rounded transition-colors"
                onClick={onStartEdit}
              >
                {column.title}
              </h3>

              {/* Badge de Contagem - Estilo Notion */}
              <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                {leads.length}
              </div>

              {/* Botão de edição direto */}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-muted"
                onClick={onStartEdit}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>

        {/* Área de Drop - Estilo Notion */}
        <div
          ref={setDropNodeRef}
          className={`flex-1 min-h-[120px] transition-colors ${
            isOver ? 'bg-blue-50 dark:bg-blue-950/20' : ''
          }`}
        >
          <div className={`space-y-2 p-2 rounded-lg border-2 border-dashed transition-colors ${
            isOver ? 'border-blue-300 dark:border-blue-600' : 'border-transparent'
          }`}>
            {leads.map((lead) => (
              <DraggableLeadCard key={lead.id} lead={lead} />
            ))}

            {/* Placeholder quando vazio */}
            {leads.length === 0 && (
              <div className="h-[100px] flex items-center justify-center text-muted-foreground text-sm">
                <div className="text-center">
                  <div className="mb-1">Área vazia</div>
                  <div className="text-xs opacity-60">Arraste leads aqui</div>
                </div>
              </div>
            )}

            {/* Botão Add Card - Estilo Notion */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddCard}
              className="w-full justify-start gap-2 h-8 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              Novo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};