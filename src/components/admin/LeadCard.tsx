import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Phone, 
  Mail, 
  User, 
  FileText,
  Clock,
  MoreHorizontal,
  Trash2,
  Eye,
  Tag,
  UserCheck
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { CountdownTimer } from "./CountdownTimer";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];

interface LeadCardProps {
  lead: Lead;
  onView: (lead: Lead) => void;
  onDelete?: (lead: Lead) => void;
  isAdmin?: boolean;
  draggable?: boolean;
  tags?: { id: string; nome: string }[];
  closerName?: string;
}

const statusColors: Record<string, string> = {
  novo_lead: "bg-yellow-100 text-yellow-800 border-yellow-300",
  em_atendimento: "bg-purple-100 text-purple-800 border-purple-300",
  finalizado: "bg-gray-100 text-gray-800 border-gray-300",
  interesse_outros: "bg-orange-100 text-orange-800 border-orange-300",
  ganho: "bg-green-100 text-green-800 border-green-300",
};

const statusLabels: Record<string, string> = {
  novo_lead: "Novo Lead",
  em_atendimento: "Em Atendimento",
  finalizado: "Finalizado",
  interesse_outros: "Interesse Outros",
  ganho: "Ganho",
};

export function LeadCard({ lead, onView, onDelete, isAdmin, draggable = true, tags, closerName }: LeadCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("leadId", lead.id);
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  // Mostrar contador apenas em status que precisam de ação
  const showCountdown = ["novo_lead", "em_atendimento"].includes(lead.status);

  return (
    <Card
      className={cn(
        "cursor-grab active:cursor-grabbing transition-all hover:shadow-md",
        isDragging && "opacity-50 rotate-2 shadow-lg",
        !draggable && "cursor-default"
      )}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <CardHeader className="p-3 pb-2 flex flex-row items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium text-sm truncate">{lead.nome_completo}</span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(lead)}>
              <Eye className="h-4 w-4 mr-2" />
              Ver detalhes
            </DropdownMenuItem>
            {isAdmin && onDelete && (
              <DropdownMenuItem 
                onClick={() => onDelete(lead)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        {/* Contador 48h */}
        {showCountdown && (
          <CountdownTimer createdAt={lead.created_at!} hoursLimit={48} />
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Phone className="h-3 w-3" />
          <span>{formatPhone(lead.telefone)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Mail className="h-3 w-3" />
          <span className="truncate">{lead.email}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileText className="h-3 w-3" />
          <span>{lead.cpf_cnpj}</span>
        </div>

        {/* Closer */}
        {closerName && (
          <div className="flex items-center gap-2 text-xs text-blue-600">
            <UserCheck className="h-3 w-3" />
            <span>{closerName}</span>
          </div>
        )}
        
        {lead.status === "ganho" && lead.valor_ganho && (
          <div className="pt-1">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              R$ {Number(lead.valor_ganho).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </Badge>
          </div>
        )}

        {/* Tags de serviço */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {tags.map(tag => (
              <Badge key={tag.id} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                <Tag className="h-2.5 w-2.5 mr-1" />
                {tag.nome}
              </Badge>
            ))}
          </div>
        )}

        {lead.status === "interesse_outros" && lead.servico_interesse && !tags?.length && (
          <div className="pt-1">
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              {lead.servico_interesse}
            </Badge>
          </div>
        )}

        <div className="flex items-center gap-1 pt-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            {format(new Date(lead.created_at!), "dd MMM, HH:mm", { locale: ptBR })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
