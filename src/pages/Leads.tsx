import { useState } from "react";
import { Button } from "@/components/ui/button";
import { List, LayoutGrid } from "lucide-react";
import { LeadsList } from "@/components/leads/LeadsList";
import { LeadsBoard } from "@/components/leads/LeadsBoard";

export type ViewMode = "list" | "board";

const Leads = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Leads
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus leads de reservas
          </p>
        </div>
        
        {/* View Toggle */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="gap-2"
          >
            <List className="w-4 h-4" />
            Lista
          </Button>
          <Button
            variant={viewMode === "board" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("board")}
            className="gap-2"
          >
            <LayoutGrid className="w-4 h-4" />
            Kanban
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-card rounded-lg border border-border">
        {viewMode === "list" ? <LeadsList /> : <LeadsBoard />}
      </div>
    </div>
  );
};

export default Leads;