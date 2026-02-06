import { useState, useEffect } from "react";
import { Tag, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useServices } from "@/hooks/useServices";
import { useLeadTags } from "@/hooks/useLeadTags";
import { useLeads } from "@/hooks/useLeads";
import { useToast } from "@/hooks/use-toast";

interface InteresseOutrosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  onSuccess: () => void;
}

export function InteresseOutrosDialog({ open, onOpenChange, leadId, onSuccess }: InteresseOutrosDialogProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { activeServices } = useServices();
  const { setLeadTags } = useLeadTags();
  const { updateLeadStatus } = useLeads();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (selectedTags.length === 0) {
      toast({
        title: "Selecione ao menos um serviço",
        description: "É necessário selecionar pelo menos um serviço de interesse.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Atualizar status do lead
      await updateLeadStatus.mutateAsync({
        id: leadId,
        status: "interesse_outros",
        servico_interesse: activeServices
          .filter(s => selectedTags.includes(s.id))
          .map(s => s.nome)
          .join(", "),
      });

      // Salvar tags
      await setLeadTags.mutateAsync({
        lead_id: leadId,
        service_ids: selectedTags,
      });

      toast({
        title: "Lead atualizado",
        description: "Interesse em outros serviços registrado.",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível registrar o interesse.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form quando abre
  useEffect(() => {
    if (open) {
      setSelectedTags([]);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-orange-600" />
            Interesse em Outros Serviços
          </DialogTitle>
          <DialogDescription>
            Selecione os serviços que o lead tem interesse
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2 max-h-60 overflow-y-auto border rounded-md p-3">
            {activeServices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum serviço cadastrado. Adicione serviços na área de Vendedores.
              </p>
            ) : (
              activeServices.map(service => (
                <div key={service.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`interesse-${service.id}`}
                    checked={selectedTags.includes(service.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTags([...selectedTags, service.id]);
                      } else {
                        setSelectedTags(selectedTags.filter(t => t !== service.id));
                      }
                    }}
                  />
                  <label htmlFor={`interesse-${service.id}`} className="text-sm cursor-pointer flex-1">
                    {service.nome}
                  </label>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || selectedTags.length === 0}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              "Confirmar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
