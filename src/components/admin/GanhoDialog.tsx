import { useState, useEffect } from "react";
import { 
  DollarSign, 
  CreditCard, 
  Banknote, 
  Calendar,
  Tag,
  Loader2,
  Receipt
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useServices } from "@/hooks/useServices";
import { useLeadTags } from "@/hooks/useLeadTags";
import { useLeads } from "@/hooks/useLeads";
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";

interface GanhoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  onSuccess: () => void;
}

const FORMAS_PAGAMENTO = [
  { value: "pix_avista", label: "PIX à Vista" },
  { value: "cartao_credito", label: "Cartão de Crédito" },
  { value: "boleto_avista", label: "Boleto à Vista" },
  { value: "boleto_30dias", label: "Boleto 30 Dias" },
  { value: "boleto_parcelado", label: "Boleto Parcelado" },
];

export function GanhoDialog({ open, onOpenChange, leadId, onSuccess }: GanhoDialogProps) {
  const [formaPagamento, setFormaPagamento] = useState("");
  const [valorTotal, setValorTotal] = useState("");
  const [dataPagamento, setDataPagamento] = useState("");
  const [qtdParcelas, setQtdParcelas] = useState("1");
  const [selectedServicos, setSelectedServicos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { activeServices } = useServices();
  const { setServicosVendidos } = useLeadTags();
  const { updateLeadStatus } = useLeads();
  const { toast } = useToast();

  // Gerar informações de parcelas
  const gerarParcelas = () => {
    const valor = parseFloat(valorTotal.replace(",", ".")) || 0;
    const numParcelas = parseInt(qtdParcelas) || 1;
    const valorParcela = valor / numParcelas;
    const dataInicio = dataPagamento ? new Date(dataPagamento) : new Date();

    const parcelas = [];
    for (let i = 0; i < numParcelas; i++) {
      parcelas.push({
        numero: i + 1,
        valor: valorParcela,
        data_vencimento: format(addDays(dataInicio, i * 30), "yyyy-MM-dd"),
        pago: false,
      });
    }
    return parcelas;
  };

  const handleSubmit = async () => {
    if (!formaPagamento || !valorTotal || selectedServicos.length === 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const valor = parseFloat(valorTotal.replace(",", "."));
      const parcelas = formaPagamento === "boleto_parcelado" ? gerarParcelas() : null;

      // Atualizar lead com status ganho e informações de pagamento
      await updateLeadStatus.mutateAsync({
        id: leadId,
        status: "ganho",
        valor_ganho: valor,
        servico_realizado: selectedServicos.join(", "),
      });

      // Salvar serviços vendidos
      await setServicosVendidos.mutateAsync({
        lead_id: leadId,
        servicos: selectedServicos.map(s => ({ service_id: s, valor: valor / selectedServicos.length })),
      });

      toast({
        title: "Venda registrada!",
        description: "O ganho foi registrado com sucesso.",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro ao registrar",
        description: "Não foi possível registrar o ganho.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form quando abre
  useEffect(() => {
    if (open) {
      setFormaPagamento("");
      setValorTotal("");
      setDataPagamento("");
      setQtdParcelas("1");
      setSelectedServicos([]);
    }
  }, [open]);

  const showParcelas = formaPagamento === "boleto_parcelado";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Registrar Ganho
          </DialogTitle>
          <DialogDescription>
            Preencha os detalhes da venda realizada
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Forma de Pagamento */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Forma de Pagamento *
            </Label>
            <Select value={formaPagamento} onValueChange={setFormaPagamento}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                {FORMAS_PAGAMENTO.map(fp => (
                  <SelectItem key={fp.value} value={fp.value}>
                    {fp.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Valor Total */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valor Total (R$) *
            </Label>
            <Input
              type="text"
              value={valorTotal}
              onChange={(e) => setValorTotal(e.target.value)}
              placeholder="0,00"
            />
          </div>

          {/* Data de Pagamento */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Data do Pagamento
            </Label>
            <Input
              type="date"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
            />
          </div>

          {/* Parcelas (se boleto parcelado) */}
          {showParcelas && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                Quantidade de Parcelas
              </Label>
              <Select value={qtdParcelas} onValueChange={setQtdParcelas}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                    <SelectItem key={n} value={n.toString()}>
                      {n}x de R$ {((parseFloat(valorTotal.replace(",", ".")) || 0) / n).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Preview das parcelas */}
              {valorTotal && (
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Previsão de Parcelas
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {gerarParcelas().map(p => (
                      <div key={p.numero} className="flex justify-between text-xs">
                        <span>Parcela {p.numero}</span>
                        <span>R$ {p.valor.toFixed(2)} - {format(new Date(p.data_vencimento), "dd/MM/yyyy")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Serviços Vendidos */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Serviços Vendidos *
            </Label>
            <div className="grid gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
              {activeServices.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum serviço cadastrado</p>
              ) : (
                activeServices.map(service => (
                  <div key={service.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`ganho-${service.id}`}
                      checked={selectedServicos.includes(service.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedServicos([...selectedServicos, service.id]);
                        } else {
                          setSelectedServicos(selectedServicos.filter(s => s !== service.id));
                        }
                      }}
                    />
                    <label htmlFor={`ganho-${service.id}`} className="text-sm cursor-pointer">
                      {service.nome}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !formaPagamento || !valorTotal || selectedServicos.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              "Registrar Ganho"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
