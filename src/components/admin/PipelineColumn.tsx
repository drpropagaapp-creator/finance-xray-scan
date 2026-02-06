import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type LeadStatus = Database["public"]["Enums"]["lead_status"];

interface PipelineColumnProps {
  status: LeadStatus;
  title: string;
  count: number;
  color: string;
  children: React.ReactNode;
  onDrop: (leadId: string, newStatus: LeadStatus) => void;
}

export function PipelineColumn({
  status,
  title,
  count,
  color,
  children,
  onDrop,
}: PipelineColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const leadId = e.dataTransfer.getData("leadId");
    if (leadId) {
      onDrop(leadId, status);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-muted/50 rounded-lg min-w-[280px] max-w-[320px] h-full transition-colors",
        isDragOver && "bg-primary/10 ring-2 ring-primary/50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className={cn("p-3 rounded-t-lg", color)}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{title}</h3>
          <span className="bg-white/80 text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full">
            {count}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
        {children}
      </div>
    </div>
  );
}
