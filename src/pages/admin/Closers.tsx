import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  UserPlus, 
  Users, 
  Trash2, 
  Loader2,
  User as UserIcon,
  ToggleLeft,
  ToggleRight,
  Pencil,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useClosers } from "@/hooks/useClosers";
import { useLeads } from "@/hooks/useLeads";
import { useToast } from "@/hooks/use-toast";

const closerSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
});

type CloserFormData = z.infer<typeof closerSchema>;

export default function Closers() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [closerToDelete, setCloserToDelete] = useState<string | null>(null);
  const [editingCloserId, setEditingCloserId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const { closers, activeClosers, isLoading, createCloser, updateCloser, deleteCloser } = useClosers();
  const { leads } = useLeads();
  const { toast } = useToast();

  const form = useForm<CloserFormData>({
    resolver: zodResolver(closerSchema),
    defaultValues: {
      nome: "",
    },
  });

  // Calcular estatísticas por closer
  const closerStats = closers.map(closer => {
    const closerLeads = leads.filter(l => l.closer_id === closer.id);
    const ganhos = closerLeads
      .filter(l => l.status === "ganho" && l.valor_ganho)
      .reduce((acc, l) => acc + (Number(l.valor_ganho) || 0), 0);
    const count = closerLeads.filter(l => l.status === "ganho").length;

    return {
      ...closer,
      totalLeads: closerLeads.length,
      leadsGanhos: count,
      valorGanhos: ganhos,
    };
  });

  const onSubmit = async (data: CloserFormData) => {
    try {
      await createCloser.mutateAsync({ nome: data.nome });

      toast({
        title: "Closer cadastrado!",
        description: `O closer ${data.nome} foi criado com sucesso.`,
      });

      form.reset();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar",
        description: error.message || "Não foi possível criar o closer.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!closerToDelete) return;

    try {
      await deleteCloser.mutateAsync(closerToDelete);

      toast({
        title: "Closer removido",
        description: "O closer foi removido com sucesso.",
      });

      setCloserToDelete(null);
    } catch (error) {
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover o closer.",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id: string, ativo: boolean) => {
    try {
      await updateCloser.mutateAsync({ id, ativo: !ativo });
      toast({
        title: ativo ? "Closer desativado" : "Closer ativado",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status.",
        variant: "destructive",
      });
    }
  };

  const handleStartEdit = (closer: typeof closers[0]) => {
    setEditingCloserId(closer.id);
    setEditingName(closer.nome);
  };

  const handleSaveEdit = async () => {
    if (!editingCloserId || !editingName.trim()) return;

    try {
      await updateCloser.mutateAsync({ id: editingCloserId, nome: editingName.trim() });
      toast({ title: "Nome atualizado!" });
      setEditingCloserId(null);
      setEditingName("");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o nome.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingCloserId(null);
    setEditingName("");
  };

  // Estatísticas gerais
  const totalGanhos = closerStats.reduce((acc, c) => acc + c.valorGanhos, 0);
  const totalLeadsComCloser = leads.filter(l => l.closer_id).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Closers</h1>
          <p className="text-muted-foreground">
            Cadastre e gerencie seus closers
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Closer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Closer</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar um novo closer
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Nome do closer"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createCloser.isPending}>
                    {createCloser.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Cadastrando...
                      </>
                    ) : (
                      "Cadastrar"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Closers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{closers.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeClosers.length} ativos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Leads com Closer
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeadsComCloser}</div>
            <p className="text-xs text-muted-foreground">
              Leads atribuídos
            </p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Ganhos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalGanhos)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Closers */}
      <Card>
        <CardHeader>
          <CardTitle>Seus Closers</CardTitle>
          <CardDescription>
            Lista de todos os seus closers com estatísticas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Ganhos</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {closerStats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum closer cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  closerStats.map((closer) => (
                    <TableRow key={closer.id}>
                      <TableCell>
                        {editingCloserId === closer.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="h-8 w-40"
                            />
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveEdit}>
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelEdit}>
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{closer.nome}</span>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-6 w-6"
                              onClick={() => handleStartEdit(closer)}
                            >
                              <Pencil className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={closer.ativo ? "default" : "secondary"}>
                          {closer.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>{closer.totalLeads}</TableCell>
                      <TableCell>{closer.leadsGanhos}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(closer.valorGanhos)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(closer.id, closer.ativo)}
                          >
                            {closer.ativo ? (
                              <ToggleRight className="h-4 w-4 text-green-600" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setCloserToDelete(closer.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Confirmação de exclusão */}
      <AlertDialog
        open={!!closerToDelete}
        onOpenChange={(open) => !open && setCloserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Closer</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este closer? 
              Leads associados a ele permanecerão no sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCloser.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Remover"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
