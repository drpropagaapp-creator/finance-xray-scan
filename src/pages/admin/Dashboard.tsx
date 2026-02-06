import { useState, useMemo } from "react";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock,
  CheckCircle,
  XCircle,
  Briefcase,
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  User
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLeads } from "@/hooks/useLeads";
import { useAuth } from "@/hooks/useAuth";
import { useVendedores } from "@/hooks/useVendedores";
import { useClosers } from "@/hooks/useClosers";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { format, subDays, startOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

type PeriodFilter = "7d" | "30d" | "thisMonth" | "all";

export default function Dashboard() {
  const { stats, leads } = useLeads();
  const { isAdmin, user } = useAuth();
  const { allUsers, getGanhosPorVendedor } = useVendedores();
  const { closers } = useClosers();
  
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("30d");
  const [vendedorFilter, setVendedorFilter] = useState<string>("all");
  const [expandedVendedor, setExpandedVendedor] = useState<string | null>(null);

  // Filtrar leads por período
  const filteredLeads = useMemo(() => {
    let filtered = leads;

    // Filtrar por vendedor (apenas admin pode filtrar)
    if (isAdmin && vendedorFilter !== "all") {
      filtered = filtered.filter(l => l.vendedor_id === vendedorFilter);
    }

    // Filtrar por período
    const now = new Date();
    let startDate: Date | null = null;

    switch (periodFilter) {
      case "7d":
        startDate = subDays(now, 7);
        break;
      case "30d":
        startDate = subDays(now, 30);
        break;
      case "thisMonth":
        startDate = startOfMonth(now);
        break;
      case "all":
      default:
        startDate = null;
    }

    if (startDate) {
      filtered = filtered.filter(l => {
        const leadDate = parseISO(l.created_at || "");
        return leadDate >= startDate!;
      });
    }

    return filtered;
  }, [leads, periodFilter, vendedorFilter, isAdmin]);

  // Estatísticas filtradas
  const filteredStats = useMemo(() => {
    return {
      total: filteredLeads.length,
      porStatus: {
        novo_lead: filteredLeads.filter(l => l.status === "novo_lead").length,
        em_atendimento: filteredLeads.filter(l => l.status === "em_atendimento").length,
        finalizado: filteredLeads.filter(l => l.status === "finalizado").length,
        interesse_outros: filteredLeads.filter(l => l.status === "interesse_outros").length,
        ganho: filteredLeads.filter(l => l.status === "ganho").length,
      },
      valorTotalGanho: filteredLeads
        .filter(l => l.status === "ganho" && l.valor_ganho)
        .reduce((acc, l) => acc + (Number(l.valor_ganho) || 0), 0),
    };
  }, [filteredLeads]);

  // Calcular ganhos do vendedor atual (se for vendedor)
  const ganhosProprios = useMemo(() => {
    if (isAdmin) return 0;
    return filteredLeads
      .filter(l => l.status === "ganho" && l.vendedor_id === user?.id && l.valor_ganho)
      .reduce((acc, l) => acc + (Number(l.valor_ganho) || 0), 0);
  }, [filteredLeads, isAdmin, user?.id]);

  // Dados para gráfico de status
  const statusChartData = useMemo(() => [
    { name: "Novos", value: filteredStats.porStatus.novo_lead, color: "#f59e0b" },
    { name: "Atendimento", value: filteredStats.porStatus.em_atendimento, color: "#8b5cf6" },
    { name: "Finalizados", value: filteredStats.porStatus.finalizado, color: "#6b7280" },
    { name: "Outros", value: filteredStats.porStatus.interesse_outros, color: "#f97316" },
    { name: "Ganhos", value: filteredStats.porStatus.ganho, color: "#10b981" },
  ].filter(d => d.value > 0), [filteredStats]);

  // Dados detalhados por vendedor (admin only)
  const vendedoresDetalhados = useMemo(() => {
    if (!isAdmin) return [];
    
    const vendedores = allUsers.filter(u => u.role === "vendedor");
    
    return vendedores.map(vendedor => {
      const vendedorLeads = leads.filter(l => l.vendedor_id === vendedor.user_id);
      const ganhos = vendedorLeads
        .filter(l => l.status === "ganho" && l.valor_ganho)
        .reduce((acc, l) => acc + (Number(l.valor_ganho) || 0), 0);
      const leadsGanhos = vendedorLeads.filter(l => l.status === "ganho").length;
      
      // Estatísticas por status
      const porStatus = {
        novo_lead: vendedorLeads.filter(l => l.status === "novo_lead").length,
        em_atendimento: vendedorLeads.filter(l => l.status === "em_atendimento").length,
        finalizado: vendedorLeads.filter(l => l.status === "finalizado").length,
        interesse_outros: vendedorLeads.filter(l => l.status === "interesse_outros").length,
        ganho: leadsGanhos,
      };

      // Taxa de conversão
      const totalAtendidos = vendedorLeads.filter(l => 
        l.status !== "novo_lead"
      ).length;
      const taxaConversao = totalAtendidos > 0 
        ? ((leadsGanhos / totalAtendidos) * 100).toFixed(1)
        : "0";

      // Closers do vendedor
      const vendedorClosers = closers.filter(c => c.vendedor_id === vendedor.user_id);

      return {
        ...vendedor,
        totalLeads: vendedorLeads.length,
        leadsGanhos,
        valorGanhos: ganhos,
        porStatus,
        taxaConversao,
        closers: vendedorClosers,
        ticketMedio: leadsGanhos > 0 ? ganhos / leadsGanhos : 0,
      };
    }).sort((a, b) => b.valorGanhos - a.valorGanhos);
  }, [leads, allUsers, closers, isAdmin]);

  // Dados para gráfico de ganhos por vendedor (admin only)
  const ganhosPorVendedorData = useMemo(() => {
    if (!isAdmin) return [];
    return vendedoresDetalhados
      .map(v => ({
        name: v.email?.split("@")[0] || v.user_id.slice(0, 8),
        valor: v.valorGanhos,
        count: v.leadsGanhos,
      }))
      .slice(0, 10);
  }, [vendedoresDetalhados, isAdmin]);

  // Dados para gráfico de evolução
  const evolucaoData = useMemo(() => {
    const days = periodFilter === "7d" ? 7 : 30;
    const data = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const dateStr = format(date, "yyyy-MM-dd");
      
      const leadsOfDay = filteredLeads.filter(l => {
        const leadDate = format(parseISO(l.created_at || ""), "yyyy-MM-dd");
        return leadDate === dateStr;
      });

      const ganhosOfDay = leadsOfDay
        .filter(l => l.status === "ganho" && l.valor_ganho)
        .reduce((acc, l) => acc + (Number(l.valor_ganho) || 0), 0);

      data.push({
        date: format(date, "dd/MM", { locale: ptBR }),
        leads: leadsOfDay.length,
        ganhos: ganhosOfDay,
      });
    }

    return data;
  }, [filteredLeads, periodFilter]);

  // Estatísticas de closers (para vendedor)
  const closerStats = useMemo(() => {
    if (isAdmin) return null;
    const myClosers = closers.filter(c => c.vendedor_id === user?.id);
    const leadsWithCloser = filteredLeads.filter(l => l.closer_id);
    
    return {
      totalClosers: myClosers.length,
      activeClosers: myClosers.filter(c => c.ativo).length,
      leadsWithCloser: leadsWithCloser.length,
    };
  }, [closers, filteredLeads, isAdmin, user?.id]);

  // Resumo geral de todos os vendedores
  const resumoGeral = useMemo(() => {
    if (!isAdmin) return null;
    
    const totalVendedores = vendedoresDetalhados.length;
    const vendedoresAtivos = vendedoresDetalhados.filter(v => v.totalLeads > 0).length;
    const totalGanhos = vendedoresDetalhados.reduce((acc, v) => acc + v.valorGanhos, 0);
    const totalLeadsGanhos = vendedoresDetalhados.reduce((acc, v) => acc + v.leadsGanhos, 0);
    const ticketMedioGeral = totalLeadsGanhos > 0 ? totalGanhos / totalLeadsGanhos : 0;
    
    return {
      totalVendedores,
      vendedoresAtivos,
      totalGanhos,
      totalLeadsGanhos,
      ticketMedioGeral,
    };
  }, [vendedoresDetalhados, isAdmin]);

  const statsCards = [
    {
      title: "Total de Leads",
      value: filteredStats.total,
      description: "Leads no período",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Novos Leads",
      value: filteredStats.porStatus.novo_lead,
      description: "Aguardando atendimento",
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Em Atendimento",
      value: filteredStats.porStatus.em_atendimento,
      description: "Sendo contactados",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Finalizados",
      value: filteredStats.porStatus.finalizado,
      description: "Sem conversão",
      icon: XCircle,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    },
    {
      title: "Interesse Outros",
      value: filteredStats.porStatus.interesse_outros,
      description: "Interesse em outros serviços",
      icon: Briefcase,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Ganhos",
      value: filteredStats.porStatus.ganho,
      description: "Serviços realizados",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
  ];

  const vendedores = allUsers.filter(u => u.role === "vendedor");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema de leads
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="thisMonth">Este mês</SelectItem>
              <SelectItem value="all">Todo período</SelectItem>
            </SelectContent>
          </Select>

          {isAdmin && (
            <Select value={vendedorFilter} onValueChange={setVendedorFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Vendedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos vendedores</SelectItem>
                {vendedores.map(v => (
                  <SelectItem key={v.user_id} value={v.user_id}>
                    {v.email?.split("@")[0] || v.user_id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statsCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Valor Total de Ganhos */}
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg">
              {isAdmin ? "Valor Total de Ganhos" : "Seus Ganhos"}
            </CardTitle>
            <CardDescription>
              {isAdmin 
                ? "Soma de todos os serviços realizados no período" 
                : "Soma dos serviços que você realizou no período"}
            </CardDescription>
          </div>
          <div className="p-3 rounded-lg bg-green-100">
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(isAdmin ? filteredStats.valorTotalGanho : ganhosProprios)}
          </div>
        </CardContent>
      </Card>

      {/* Tabs para Admin: Visão Geral vs Individual */}
      {isAdmin && (
        <Tabs defaultValue="geral" className="space-y-4">
          <TabsList>
            <TabsTrigger value="geral">Visão Geral</TabsTrigger>
            <TabsTrigger value="individual">Por Vendedor</TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-4">
            {/* Resumo Geral */}
            {resumoGeral && (
              <div className="grid gap-4 md:grid-cols-5">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Vendedores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{resumoGeral.totalVendedores}</div>
                    <p className="text-xs text-muted-foreground">{resumoGeral.vendedoresAtivos} ativos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Total Ganhos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(resumoGeral.totalGanhos)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Leads Ganhos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{resumoGeral.totalLeadsGanhos}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Ticket Médio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(resumoGeral.ticketMedioGeral)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Média por Vendedor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                        resumoGeral.totalVendedores > 0 ? resumoGeral.totalGanhos / resumoGeral.totalVendedores : 0
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Gráficos */}
            <div className="grid gap-4 lg:grid-cols-2">
              {statusChartData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Distribuição por Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {statusChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {ganhosPorVendedorData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ranking de Vendedores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ganhosPorVendedorData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                          <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                          <Tooltip 
                            formatter={(value: number) => [
                              new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value),
                              "Valor"
                            ]}
                          />
                          <Bar dataKey="valor" fill="#10b981" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Gráfico de Evolução */}
            {(periodFilter === "7d" || periodFilter === "30d") && evolucaoData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Evolução no Período</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={evolucaoData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                        <Tooltip 
                          formatter={(value: number, name: string) => [
                            name === "ganhos" 
                              ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
                              : value,
                            name === "leads" ? "Leads" : "Ganhos"
                          ]}
                        />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="leads" stroke="#3b82f6" name="Leads" strokeWidth={2} />
                        <Line yAxisId="right" type="monotone" dataKey="ganhos" stroke="#10b981" name="Ganhos (R$)" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="individual" className="space-y-4">
            {/* Tabela de Vendedores com Detalhes Expansíveis */}
            <Card>
              <CardHeader>
                <CardTitle>Dados por Vendedor</CardTitle>
                <CardDescription>Clique em um vendedor para ver detalhes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {vendedoresDetalhados.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum vendedor cadastrado
                    </div>
                  ) : (
                    vendedoresDetalhados.map((vendedor) => (
                      <Collapsible
                        key={vendedor.user_id}
                        open={expandedVendedor === vendedor.user_id}
                        onOpenChange={(open) => setExpandedVendedor(open ? vendedor.user_id : null)}
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{vendedor.email || vendedor.user_id.slice(0, 8)}</p>
                                <p className="text-sm text-muted-foreground">
                                  {vendedor.totalLeads} leads • {vendedor.leadsGanhos} ganhos
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-bold text-green-600">
                                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(vendedor.valorGanhos)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Taxa: {vendedor.taxaConversao}%
                                </p>
                              </div>
                              {expandedVendedor === vendedor.user_id ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="p-4 border border-t-0 rounded-b-lg bg-muted/30 space-y-4">
                            {/* Estatísticas por Status */}
                            <div>
                              <h4 className="font-medium mb-2">Leads por Status</h4>
                              <div className="grid grid-cols-5 gap-2">
                                <div className="text-center p-2 bg-yellow-50 rounded-lg">
                                  <div className="text-lg font-bold text-yellow-600">{vendedor.porStatus.novo_lead}</div>
                                  <div className="text-xs text-muted-foreground">Novos</div>
                                </div>
                                <div className="text-center p-2 bg-purple-50 rounded-lg">
                                  <div className="text-lg font-bold text-purple-600">{vendedor.porStatus.em_atendimento}</div>
                                  <div className="text-xs text-muted-foreground">Atendimento</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 rounded-lg">
                                  <div className="text-lg font-bold text-gray-600">{vendedor.porStatus.finalizado}</div>
                                  <div className="text-xs text-muted-foreground">Finalizados</div>
                                </div>
                                <div className="text-center p-2 bg-orange-50 rounded-lg">
                                  <div className="text-lg font-bold text-orange-600">{vendedor.porStatus.interesse_outros}</div>
                                  <div className="text-xs text-muted-foreground">Outros</div>
                                </div>
                                <div className="text-center p-2 bg-green-50 rounded-lg">
                                  <div className="text-lg font-bold text-green-600">{vendedor.porStatus.ganho}</div>
                                  <div className="text-xs text-muted-foreground">Ganhos</div>
                                </div>
                              </div>
                            </div>

                            {/* Métricas */}
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                                <p className="text-lg font-bold">
                                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(vendedor.ticketMedio)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                                <p className="text-lg font-bold">{vendedor.taxaConversao}%</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Closers</p>
                                <p className="text-lg font-bold">
                                  {vendedor.closers.length} ({vendedor.closers.filter(c => c.ativo).length} ativos)
                                </p>
                              </div>
                            </div>

                            {/* Lista de Closers */}
                            {vendedor.closers.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2">Closers</h4>
                                <div className="flex flex-wrap gap-2">
                                  {vendedor.closers.map(closer => (
                                    <Badge key={closer.id} variant={closer.ativo ? "default" : "secondary"}>
                                      {closer.nome}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Estatísticas de Closers (Vendedor) */}
      {!isAdmin && closerStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Seus Closers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{closerStats.totalClosers}</div>
                <p className="text-xs text-muted-foreground">Total de Closers</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{closerStats.activeClosers}</div>
                <p className="text-xs text-muted-foreground">Closers Ativos</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{closerStats.leadsWithCloser}</div>
                <p className="text-xs text-muted-foreground">Leads com Closer</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dicas Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>📋 <strong>Pipeline:</strong> Arraste os cards entre as colunas para atualizar o status dos leads.</p>
          <p>💰 <strong>Ganhos:</strong> Ao mover um lead para "Ganho", informe o valor e o serviço realizado.</p>
          {isAdmin ? (
            <p>👥 <strong>Vendedores:</strong> Cadastre vendedores e atribua leads a eles na página de Pipeline.</p>
          ) : (
            <p>👤 <strong>Closers:</strong> Gerencie seus closers na página dedicada e atribua-os aos leads.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
