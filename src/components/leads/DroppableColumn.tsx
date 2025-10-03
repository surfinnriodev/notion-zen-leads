import { useDroppable } from "@dnd-kit/core";
import { LeadWithCalculation } from "@/types/leads";
import { DraggableLeadCard } from "./DraggableLeadCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Check, X } from "lucide-react";
import { useState } from "react";

interface DroppableColumnProps {
  id: string;
  title: string;
  leads: LeadWithCalculation[];
  onTitleEdit?: (newTitle: string) => void;
  isEditing?: boolean;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  color?: string;
}

export const DroppableColumn = ({
  id,
  title,
  leads,
  onTitleEdit,
  isEditing,
  onStartEdit,
  onCancelEdit,
  color
}: DroppableColumnProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });
  const [editTitle, setEditTitle] = useState(title);

  const style = {
    backgroundColor: isOver ? 'rgba(59, 130, 246, 0.1)' : undefined,
  };

  const handleSaveTitle = () => {
    if (editTitle.trim() && onTitleEdit) {
      onTitleEdit(editTitle.trim());
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(title);
    onCancelEdit?.();
  };

  return (
    <div className="space-y-3 sm:space-y-4 group h-full flex flex-col">
      <div className="flex items-center gap-2 flex-shrink-0">
        {color && (
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
        )}
        {isEditing ? (
          <div className="flex items-center gap-1 flex-1">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="h-7 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle();
                if (e.key === 'Escape') handleCancelEdit();
              }}
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={handleSaveTitle}
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={handleCancelEdit}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <>
            <h3 className="font-medium text-foreground text-sm sm:text-base truncate flex-1">{title}</h3>
            {onStartEdit && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 opacity-0 sm:group-hover:opacity-100 transition-opacity"
                onClick={onStartEdit}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            )}
          </>
        )}
        <Badge variant="secondary" className="text-xs px-2 py-0.5 flex-shrink-0">
          {leads.length}
        </Badge>
      </div>

      <div
        ref={setNodeRef}
        style={style}
        className={`flex-1 space-y-2 sm:space-y-3 min-h-[300px] sm:min-h-[400px] max-h-[calc(100vh-250px)] overflow-y-auto p-2 rounded-lg border-2 border-dashed transition-colors ${
          isOver ? 'border-blue-300 bg-blue-50/50 dark:border-blue-600 dark:bg-blue-950/20' : 'border-transparent'
        }`}
      >
        {leads.map((lead) => (
          <DraggableLeadCard key={lead.id} lead={lead} />
        ))}

        {leads.length === 0 && (
          <div className="text-center py-8 sm:py-12 text-muted-foreground text-xs sm:text-sm">
            <div className="text-4xl sm:text-5xl mb-2">📭</div>
            <div>Nenhum lead aqui</div>
            <div className="text-[10px] sm:text-xs opacity-60 mt-1">Arraste cards para cá</div>
          </div>
        )}
      </div>
    </div>
  );
};