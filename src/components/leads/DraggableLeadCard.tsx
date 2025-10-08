import { useDraggable } from "@dnd-kit/core";
import { LeadCard } from "./LeadCard";
import { LeadWithCalculation } from "@/types/leads";
import { GripVertical } from "lucide-react";

interface DraggableLeadCardProps {
  lead: LeadWithCalculation;
}

export const DraggableLeadCard = ({ lead }: DraggableLeadCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: lead.id.toString(),
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? 'opacity-50' : ''}`}
    >
      {/* Handle de Drag - Apenas este elemento inicia o drag */}
      <div
        {...listeners}
        {...attributes}
        className="absolute left-1 top-1 z-10 cursor-grab active:cursor-grabbing p-1 hover:bg-accent/50 rounded transition-colors"
        title="Segurar para arrastar"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      
      {/* Card - Clicável normalmente */}
      <LeadCard lead={lead} />
    </div>
  );
};