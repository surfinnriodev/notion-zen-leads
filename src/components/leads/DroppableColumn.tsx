import { useDroppable } from "@dnd-kit/core";
import { LeadWithCalculation } from "@/types/leads";
import { DraggableLeadCard } from "./DraggableLeadCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-3 sm:space-y-4 group">
      <div className="flex items-center gap-2">
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
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={onStartEdit}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            )}
          </>
        )}
        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded flex-shrink-0">
          {leads.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        style={style}
        className={`space-y-2 sm:space-y-3 min-h-[160px] sm:min-h-[200px] p-2 rounded-lg border-2 border-dashed transition-colors ${
          isOver ? 'border-blue-300 bg-blue-50/50 dark:border-blue-600 dark:bg-blue-950/20' : 'border-transparent'
        }`}
      >
        {leads.map((lead) => (
          <DraggableLeadCard key={lead.id} lead={lead} />
        ))}

        {leads.length === 0 && (
          <div className="text-center py-6 sm:py-8 text-muted-foreground text-xs sm:text-sm">
            Nenhum lead
          </div>
        )}
      </div>
    </div>
  );
};