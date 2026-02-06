import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  UserPlus, 
  Users, 
  Trash2, 
  Loader2,
  Mail,
  Lock,
  User as UserIcon,
  DollarSign,
  Shuffle,
  ToggleLeft,
  ToggleRight,
  Plus,
  X,
  Send,
  CheckSquare
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useVendedores } from "@/hooks/useVendedores";
import { useLeads } from "@/hooks/useLeads";
import { useLeadDistribution } from "@/hooks/useLeadDistribution";
import { useToast } from "@/hooks/use-toast";
import { vendedorSchema, type VendedorFormData } from "@/lib/validations";

export default function Vendedores() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [vendedorToDelete, setVendedorToDelete] = useState<string | null>(null);
  const [selectedVendedorToAdd, setSelectedVendedorToAdd] = useState("");
  const [selectedLeadsForDistribution, setSelectedLeadsForDistribution] = useState<string[]>([]);
  const [targetVendedorForDistribution, setTargetVendedorForDistribution] = useState("");
  const [isDistributing, setIsDistributing] = useState(false);

  const { vendedores, allUsers, isLoading, createVendedor, deleteVendedor, getGanhosPorVendedor } = useVendedores();
  const { leads, assignVendedor } = useLeads();
  const { 
    config, 
    vendedorDistributions, 
    updateConfig, 
    addVendedorToDistribution, 
    updateVendedorDistribution,
    removeVendedorFromDistribution 
  } = useLeadDistribution();
  const { toast } = useToast();

  const ganhosPorVendedor = getGanhosPorVendedor(leads);

  // Leads não atribuídos
  const unassignedLeads = leads.filter(l => !l.vendedor_id);

  const form = useForm<VendedorFormData>({
    resolver: zodResolver(vendedorSchema),
    defaultValues: {
      email: "",
      password: "",
      nome: "",
    },
  });

  const onSubmit = async (data: VendedorFormData) => {
    try {
      await createVendedor.mutateAsync({
        email: data.email,
        password: data.password,
      });

      toast({
        title: "Vendedor cadastrado!",
        description: `O vendedor ${data.email} foi criado com sucesso.`,
      });

      form.reset();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar",
        description: error.message || "Não foi possível criar o vendedor.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!vendedorToDelete) return;

    try {
      await deleteVendedor.mutateAsync(vendedorToDelete);

      toast({
        title: "Vendedor removido",
        description: "O vendedor foi removido com sucesso.",
      });

      setVendedorToDelete(null);
    } catch (error) {
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover o vendedor.",
        variant: "destructive",
      });
    }
  };

  const handleToggleDistribution = async () => {
    try {
      await updateConfig.mutateAsync({ enabled: !config?.enabled });
      toast({
        title: config?.enabled ? "Distribuição desativada" : "Distribuição ativada",
        description: config?.enabled 
          ? "Novos leads não serão mais distribuídos automaticamente." 
          : "Novos leads serão distribuídos automaticamente para os vendedores ativos.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar a configuração.",
        variant: "destructive",
      });
    }
  };

  const handleAddToDistribution = async () => {
    if (!selectedVendedorToAdd) return;

    try {
      await addVendedorToDistribution.mutateAsync({ vendedor_id: selectedVendedorToAdd });
      setSelectedVendedorToAdd("");
      toast({ title: "Vendedor adicionado", description: "Vendedor adicionado à distribuição." });
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível adicionar.", variant: "destructive" });
    }
  };

  const handleToggleVendedorActive = async (id: string, active: boolean) => {
    try {
      await updateVendedorDistribution.mutateAsync({ id, active: !active });
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível alterar.", variant: "destructive" });
    }
  };

  const handleRemoveFromDistribution = async (id: string) => {
    try {
      await removeVendedorFromDistribution.mutateAsync(id);
      toast({ title: "Removido", description: "Vendedor removido da distribuição." });
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível remover.", variant: "destructive" });
    }
  };

  // Distribuição manual de leads
  const handleToggleLeadSelection = (leadId: string) => {
    setSelectedLeadsForDistribution(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAllLeads = () => {
    if (selectedLeadsForDistribution.length === unassignedLeads.length) {
      setSelectedLeadsForDistribution([]);
    } else {
      setSelectedLeadsForDistribution(unassignedLeads.map(l => l.id));
    }
  };

  const handleDistributeLeads = async () => {
    if (!targetVendedorForDistribution || selectedLeadsForDistribution.length === 0) {
      toast({ 
        title: "Selecione os leads e vendedor", 
        description: "Escolha pelo menos um lead e um vendedor para distribuir.",
        variant: "destructive" 
      });
      return;
    }

    setIsDistributing(true);
    try {
      // Distribuir cada lead selecionado
      for (const leadId of selectedLeadsForDistribution) {
        await assignVendedor.mutateAsync({
          leadId,
          vendedorId: targetVendedorForDistribution,
        });
      }

      toast({ 
        title: "Leads distribuídos!", 
        description: `${selectedLeadsForDistribution.length} lead(s) atribuído(s) com sucesso.` 
      });
      
      setSelectedLeadsForDistribution([]);
      setTargetVendedorForDistribution("");
    } catch (error) {
      toast({ 
        title: "Erro na distribuição", 
        description: "Não foi possível distribuir todos os leads.",
        variant: "destructive" 
      });
    } finally {
      setIsDistributing(false);
    }
  };

  // Vendedores não incluídos na distribuição
  const vendedoresInDistribution = vendedorDistributions.map(vd => vd.vendedor_id);
  const vendedoresNotInDistribution = allUsers.filter(
    u => u.role === "vendedor" && !vendedoresInDistribution.includes(u.user_id)
  );

  // Apenas vendedores para distribuição manual
  const vendedoresForManualDistribution = allUsers.filter(u => u.role === "vendedor");

  // Calcular estatísticas de todos os usuários
  const usersWithStats = allUsers.map((user) => ({
    ...user,
    ganhos: ganhosPorVendedor[user.user_id] || { total: 0, count: 0 },
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Vendedores</h1>
          <p className="text-muted-foreground">
            Cadastre e gerencie os vendedores do sistema
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Vendedor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Vendedor</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar um novo vendedor no sistema
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
                            placeholder="Nome do vendedor"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="email@exemplo.com"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="password"
                            placeholder="••••••••"
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
                  <Button type="submit" disabled={createVendedor.isPending}>
                    {createVendedor.isPending ? (
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

      {/* Resumo de Ganhos */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Usuários
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allUsers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vendedores
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allUsers.filter((u) => u.role === "vendedor").length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Ganhos
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(
                Object.values(ganhosPorVendedor).reduce((acc, g) => acc + g.total, 0)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição Automática de Leads */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shuffle className="h-5 w-5" />
                Distribuição Automática de Leads
              </CardTitle>
              <CardDescription>
                Quando ativada, novos leads serão distribuídos automaticamente entre os vendedores ativos
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="distribution-toggle">
                {config?.enabled ? "Ativada" : "Desativada"}
              </Label>
              <Switch
                id="distribution-toggle"
                checked={config?.enabled ?? false}
                onCheckedChange={handleToggleDistribution}
                disabled={updateConfig.isPending}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Adicionar vendedor à distribuição */}
          <div className="flex gap-2">
            <Select 
              value={selectedVendedorToAdd} 
              onValueChange={setSelectedVendedorToAdd}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione um vendedor para adicionar" />
              </SelectTrigger>
              <SelectContent>
                {vendedoresNotInDistribution.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Todos os vendedores já estão na distribuição
                  </SelectItem>
                ) : (
                  vendedoresNotInDistribution.map(v => (
                    <SelectItem key={v.user_id} value={v.user_id}>
                      {v.email || v.nome || v.user_id.slice(0, 8)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleAddToDistribution} 
              disabled={!selectedVendedorToAdd || addVendedorToDistribution.isPending}
            >
              {addVendedorToDistribution.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </>
              )}
            </Button>
          </div>

          {/* Lista de vendedores na distribuição */}
          {vendedorDistributions.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              Nenhum vendedor na distribuição. Adicione vendedores acima.
            </div>
          ) : (
            <div className="border rounded-lg divide-y">
              {vendedorDistributions.map(vd => (
                <div key={vd.id} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggleVendedorActive(vd.id, vd.active)}
                    >
                      {vd.active ? (
                        <ToggleRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-gray-400" />
                      )}
                    </Button>
                    <div>
                      <p className="font-medium text-sm">
                        {allUsers.find(u => u.user_id === vd.vendedor_id)?.email || vd.vendedor_id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {vd.active ? "Recebendo leads" : "Pausado"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemoveFromDistribution(vd.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Distribuição Manual de Leads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Distribuição Manual de Leads
          </CardTitle>
          <CardDescription>
            Selecione leads não atribuídos e distribua manualmente para um vendedor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {unassignedLeads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Todos os leads já estão atribuídos!</p>
            </div>
          ) : (
            <>
              {/* Controles de distribuição */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Select 
                  value={targetVendedorForDistribution} 
                  onValueChange={setTargetVendedorForDistribution}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione o vendedor destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendedoresForManualDistribution.length === 0 ? (
                      <SelectItem value="none" disabled>
                        Nenhum vendedor cadastrado
                      </SelectItem>
                    ) : (
                      vendedoresForManualDistribution.map(v => (
                        <SelectItem key={v.user_id} value={v.user_id}>
                          {v.nome || v.email || v.user_id.slice(0, 8)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleDistributeLeads} 
                  disabled={selectedLeadsForDistribution.length === 0 || !targetVendedorForDistribution || isDistributing}
                >
                  {isDistributing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Distribuindo...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Distribuir {selectedLeadsForDistribution.length > 0 ? `(${selectedLeadsForDistribution.length})` : ""}
                    </>
                  )}
                </Button>
              </div>

              {/* Lista de leads não atribuídos */}
              <div className="border rounded-lg">
                <div className="flex items-center gap-3 p-3 border-b bg-muted/50">
                  <Checkbox
                    id="select-all-leads"
                    checked={selectedLeadsForDistribution.length === unassignedLeads.length && unassignedLeads.length > 0}
                    onCheckedChange={handleSelectAllLeads}
                  />
                  <label htmlFor="select-all-leads" className="text-sm font-medium cursor-pointer">
                    Selecionar todos ({unassignedLeads.length} leads)
                  </label>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y">
                  {unassignedLeads.map(lead => (
                    <div 
                      key={lead.id} 
                      className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors"
                    >
                      <Checkbox
                        id={`lead-${lead.id}`}
                        checked={selectedLeadsForDistribution.includes(lead.id)}
                        onCheckedChange={() => handleToggleLeadSelection(lead.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{lead.nome_completo}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {lead.email} • {lead.telefone}
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {lead.status === "novo_lead" ? "Novo" : lead.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Lista de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Equipe</CardTitle>
          <CardDescription>
            Lista de todos os usuários do sistema com seus ganhos
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
                  <TableHead>Usuário</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Leads Ganhos</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersWithStats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  usersWithStats.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>
                        {user.email || user.nome || user.user_id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.role === "admin" ? "default" : "secondary"}
                        >
                          {user.role === "admin" ? "Admin" : "Vendedor"}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.ganhos.count}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(user.ganhos.total)}
                      </TableCell>
                      <TableCell className="text-right">
                        {user.role === "vendedor" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setVendedorToDelete(user.user_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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
        open={!!vendedorToDelete}
        onOpenChange={(open) => !open && setVendedorToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Vendedor</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este vendedor? 
              Ele perderá o acesso ao sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteVendedor.isPending ? (
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
