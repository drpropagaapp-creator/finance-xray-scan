import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Phone, 
  Mail, 
  User, 
  FileText,
  Clock,
  DollarSign,
  Briefcase,
  MessageSquare,
  Save,
  Loader2,
  UserCircle,
  Tag,
  UserCheck
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useLeads } from "@/hooks/useLeads";
import { useVendedores } from "@/hooks/useVendedores";
import { useClosers } from "@/hooks/useClosers";
import { useServices } from "@/hooks/useServices";
import { useLeadTags } from "@/hooks/useLeadTags";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { CountdownTimer } from "./CountdownTimer";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadStatus = Database["public"]["Enums"]["lead_status"];

interface LeadModalProps {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

const statusLabels: Record<LeadStatus, string> = {
  novo_lead: "Novo Lead",
  em_atendimento: "Em Atendimento",
  finalizado: "Finalizado",
  interesse_outros: "Interesse Outros",
  ganho: "Ganho",
};

const statusColors: Record<LeadStatus, string> = {
  novo_lead: "bg-yellow-100 text-yellow-800",
  em_atendimento: "bg-purple-100 text-purple-800",
  finalizado: "bg-gray-100 text-gray-800",
  interesse_outros: "bg-orange-100 text-orange-800",
  ganho: "bg-green-100 text-green-800",
};

export function LeadModal({ lead, open, onClose, isAdmin }: LeadModalProps) {
  const { isVendedor } = useAuth();
  const [newStatus, setNewStatus] = useState<LeadStatus | null>(null);
  const [notas, setNotas] = useState("");
  const [selectedVendedor, setSelectedVendedor] = useState<string>("");
  const [selectedCloser, setSelectedCloser] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { updateLeadStatus, updateLead, assignVendedor } = useLeads();
  const { allUsers } = useVendedores();
  const { closers } = useClosers();
  const { activeServices } = useServices();
  const { getTagsForLead, setLeadTags } = useLeadTags();
  const { toast } = useToast();

  // Reset state when modal opens with a new lead - using useEffect for proper sync
  useEffect(() => {
    if (open && lead) {
      setNewStatus(lead.status);
      setNotas(lead.notas || "");
      setSelectedVendedor(lead.vendedor_id || "");
      setSelectedCloser(lead.closer_id || "");
      
      const leadTags = getTagsForLead(lead.id);
      setSelectedTags(leadTags.map(t => t.service_id));
    }
  }, [open, lead?.id]); // Reset when modal opens or lead changes

  // Vendedor não pode editar dados, só ver e mudar status/notas/closer
  const canEditData = isAdmin;
  const canChangeStatus = isAdmin || isVendedor;
  const canAssignCloser = isAdmin || isVendedor;

  const handleSave = async () => {
    if (!lead) return;

    try {
      // Atualizar status se mudou
      if (newStatus && newStatus !== lead.status) {
        await updateLeadStatus.mutateAsync({
          id: lead.id,
          status: newStatus,
        });
      }

      // Atualizar notas e closer
      const updates: any = {};
      if (notas !== (lead.notas || "")) updates.notas = notas;
      if (selectedCloser !== (lead.closer_id || "")) {
        updates.closer_id = selectedCloser || null;
      }

      if (Object.keys(updates).length > 0) {
        await updateLead.mutateAsync({ id: lead.id, ...updates });
      }

      // Atribuir vendedor se mudou (apenas admin)
      if (isAdmin && selectedVendedor !== (lead.vendedor_id || "")) {
        await assignVendedor.mutateAsync({
          leadId: lead.id,
          vendedorId: selectedVendedor || null,
        });
      }

      // Atualizar tags se status é interesse_outros
      if ((newStatus || lead.status) === "interesse_outros") {
        await setLeadTags.mutateAsync({
          lead_id: lead.id,
          service_ids: selectedTags,
        });
      }

      toast({
        title: "Lead atualizado",
        description: "As alterações foram salvas com sucesso.",
      });

      onClose();
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    }
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

  const formatCPFCNPJ = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
    }
    if (cleaned.length === 14) {
      return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
    }
    return value;
  };

  // Handle dialog close
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  if (!lead) return null;

  const isPending = updateLeadStatus.isPending || updateLead.isPending || assignVendedor.isPending || setLeadTags.isPending;
  const showCountdown = ["novo_lead", "em_atendimento"].includes(lead.status);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {lead.nome_completo}
          </DialogTitle>
          <DialogDescription>
            {canEditData ? "Detalhes e gerenciamento do lead" : "Visualização e acompanhamento do lead"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Contador 48h */}
          {showCountdown && (
            <CountdownTimer createdAt={lead.created_at!} hoursLimit={48} />
          )}

          {/* Status atual */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge className={statusColors[lead.status]}>
              {statusLabels[lead.status]}
            </Badge>
          </div>

          <Separator />

          {/* Informações do Lead (somente leitura para vendedor) */}
          <div className="grid gap-3">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{formatPhone(lead.telefone)}</span>
              <a 
                href={`https://wa.me/55${lead.telefone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-600 hover:underline"
              >
                WhatsApp
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{lead.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{formatCPFCNPJ(lead.cpf_cnpj)}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Criado em {format(new Date(lead.created_at!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
          </div>

          <Separator />

          {/* Alterar Status */}
          {canChangeStatus && (
            <div className="space-y-2">
              <Label>Alterar Status</Label>
              <Select
                value={newStatus || lead.status}
                onValueChange={(value) => setNewStatus(value as LeadStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tags para Interesse Outros */}
          {(newStatus || lead.status) === "interesse_outros" && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Serviços de Interesse
              </Label>
              <div className="grid gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                {activeServices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum serviço cadastrado</p>
                ) : (
                  activeServices.map(service => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={service.id}
                        checked={selectedTags.includes(service.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTags([...selectedTags, service.id]);
                          } else {
                            setSelectedTags(selectedTags.filter(t => t !== service.id));
                          }
                        }}
                      />
                      <label htmlFor={service.id} className="text-sm cursor-pointer">
                        {service.nome}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Atribuir Closer */}
          {canAssignCloser && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Closer Responsável
              </Label>
              <Select
                value={selectedCloser || "none"}
                onValueChange={(value) => setSelectedCloser(value === "none" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um closer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {closers.filter(c => c.ativo).map((closer) => (
                    <SelectItem key={closer.id} value={closer.id}>
                      {closer.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Atribuir Vendedor (apenas admin) */}
          {isAdmin && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                Atribuir a Vendedor
              </Label>
              <Select
                value={selectedVendedor || "none"}
                onValueChange={(value) => setSelectedVendedor(value === "none" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um vendedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum (remover atribuição)</SelectItem>
                  {allUsers
                    .filter((user) => user.role === "vendedor")
                    .map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.nome || user.email || user.user_id.slice(0, 8)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notas */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Notas
            </Label>
            <Textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Adicione observações sobre este lead..."
              rows={3}
            />
          </div>

          {/* Botão Salvar */}
          <Button onClick={handleSave} className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
