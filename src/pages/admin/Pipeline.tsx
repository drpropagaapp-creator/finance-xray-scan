import { useState } from "react";
import { Loader2, AlertCircle, Filter } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { useAuth } from "@/hooks/useAuth";
import { useServices } from "@/hooks/useServices";
import { useLeadTags } from "@/hooks/useLeadTags";
import { useClosers } from "@/hooks/useClosers";
import { useToast } from "@/hooks/use-toast";
import { PipelineColumn } from "@/components/admin/PipelineColumn";
import { LeadCard } from "@/components/admin/LeadCard";
import { LeadModal } from "@/components/admin/LeadModal";
import { GanhoDialog } from "@/components/admin/GanhoDialog";
import { InteresseOutrosDialog } from "@/components/admin/InteresseOutrosDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadStatus = Database["public"]["Enums"]["lead_status"];

const columns: { status: LeadStatus; title: string; color: string }[] = [
  { status: "novo_lead", title: "Novo Lead", color: "bg-yellow-100 text-yellow-800" },
  { status: "em_atendimento", title: "Em Atendimento", color: "bg-purple-100 text-purple-800" },
  { status: "finalizado", title: "Finalizado", color: "bg-gray-100 text-gray-800" },
  { status: "interesse_outros", title: "Interesse Outros", color: "bg-orange-100 text-orange-800" },
  { status: "ganho", title: "Ganho", color: "bg-green-100 text-green-800" },
];

export default function Pipeline() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [pendingDrop, setPendingDrop] = useState<{ leadId: string; status: LeadStatus } | null>(null);
  const [filterTag, setFilterTag] = useState<string>("");

  const { leads, isLoading, updateLeadStatus, deleteLead } = useLeads();
  const { isAdmin } = useAuth();
  const { activeServices } = useServices();
  const { tags, getTagsForLead } = useLeadTags();
  const { closers } = useClosers();
  const { toast } = useToast();

  const handleDrop = (leadId: string, newStatus: LeadStatus) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    if (newStatus === "interesse_outros" || newStatus === "ganho") {
      setPendingDrop({ leadId, status: newStatus });
      return;
    }

    updateLeadStatus.mutate(
      { id: leadId, status: newStatus },
      {
        onSuccess: () => {
          toast({
            title: "Lead atualizado",
            description: `Status alterado para "${columns.find(c => c.status === newStatus)?.title}"`,
          });
        },
        onError: () => {
          toast({
            title: "Erro ao atualizar",
            description: "Não foi possível alterar o status do lead.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleDeleteLead = (lead: Lead) => {
    setLeadToDelete(lead);
  };

  const confirmDelete = () => {
    if (!leadToDelete) return;

    deleteLead.mutate(leadToDelete.id, {
      onSuccess: () => {
        toast({ title: "Lead excluído", description: "O lead foi removido com sucesso." });
        setLeadToDelete(null);
      },
      onError: () => {
        toast({ title: "Erro ao excluir", description: "Não foi possível excluir o lead.", variant: "destructive" });
      },
    });
  };

  // Filtrar leads por tag
  const filteredLeads = filterTag
    ? leads.filter(lead => {
        const leadTags = getTagsForLead(lead.id);
        return leadTags.some(t => t.service_id === filterTag);
      })
    : leads;

  // Helper para obter tags de um lead
  const getLeadTags = (leadId: string) => {
    const leadTagIds = getTagsForLead(leadId).map(t => t.service_id);
    return activeServices.filter(s => leadTagIds.includes(s.id));
  };

  // Helper para obter nome do closer
  const getCloserName = (closerId: string | null) => {
    if (!closerId) return undefined;
    return closers.find(c => c.id === closerId)?.nome;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pipeline de Leads</h1>
          <p className="text-muted-foreground">Arraste os cards para alterar o status</p>
        </div>

        {/* Filtro por Tag */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterTag || "all"} onValueChange={(v) => setFilterTag(v === "all" ? "" : v)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por serviço" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {activeServices.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filterTag && (
              <Button variant="ghost" size="sm" onClick={() => setFilterTag("")}>
                Limpar
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Pipeline Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const columnLeads = filteredLeads.filter((l) => l.status === column.status);

          return (
            <PipelineColumn
              key={column.status}
              status={column.status}
              title={column.title}
              count={columnLeads.length}
              color={column.color}
              onDrop={handleDrop}
            >
              {columnLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onView={setSelectedLead}
                  onDelete={isAdmin ? handleDeleteLead : undefined}
                  isAdmin={isAdmin}
                  tags={getLeadTags(lead.id)}
                  closerName={getCloserName(lead.closer_id)}
                />
              ))}
              {columnLeads.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Nenhum lead nesta coluna
                </div>
              )}
            </PipelineColumn>
          );
        })}
      </div>

      {/* Modal de detalhes */}
      <LeadModal lead={selectedLead} open={!!selectedLead} onClose={() => setSelectedLead(null)} isAdmin={isAdmin} />

      {/* Dialog Interesse Outros */}
      <InteresseOutrosDialog
        open={pendingDrop?.status === "interesse_outros"}
        onOpenChange={(open) => !open && setPendingDrop(null)}
        leadId={pendingDrop?.leadId || ""}
        onSuccess={() => setPendingDrop(null)}
      />

      {/* Dialog Ganho */}
      <GanhoDialog
        open={pendingDrop?.status === "ganho"}
        onOpenChange={(open) => !open && setPendingDrop(null)}
        leadId={pendingDrop?.leadId || ""}
        onSuccess={() => setPendingDrop(null)}
      />

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!leadToDelete} onOpenChange={(open) => !open && setLeadToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o lead <strong>{leadToDelete?.nome_completo}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
