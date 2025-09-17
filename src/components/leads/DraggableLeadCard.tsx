import { useDraggable } from "@dnd-kit/core";
import { LeadCard } from "./LeadCard";
import { LeadWithCalculation } from "@/types/leads";

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
      {...listeners}
      {...attributes}
      className={`${isDragging ? 'opacity-50' : ''}`}
    >
      <LeadCard lead={lead} />
    </div>
  );
};