import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];
type LeadStatus = Database["public"]["Enums"]["lead_status"];

export function useLeads() {
  const { user, isAdmin, isVendedor } = useAuth();
  const queryClient = useQueryClient();

  const leadsQuery = useQuery({
    queryKey: ["leads", user?.id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("leads")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Erro ao buscar leads:", error.message);
          throw new Error(`Falha ao carregar leads: ${error.message}`);
        }
        
        return data as Lead[];
      } catch (err) {
        console.error("Erro inesperado ao buscar leads:", err);
        throw err;
      }
    },
    enabled: !!user && (isAdmin || isVendedor),
  });

  const createLead = useMutation({
    mutationFn: async (lead: LeadInsert) => {
      const { data, error } = await supabase
        .from("leads")
        .insert(lead)
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar lead:", error.message);
        throw new Error(`Falha ao criar lead: ${error.message}`);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const updateLead = useMutation({
    mutationFn: async ({ id, ...updates }: LeadUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("leads")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Erro ao atualizar lead:", error.message);
        throw new Error(`Falha ao atualizar lead: ${error.message}`);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const updateLeadStatus = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      servico_interesse,
      valor_ganho,
      servico_realizado 
    }: { 
      id: string; 
      status: LeadStatus;
      servico_interesse?: string;
      valor_ganho?: number;
      servico_realizado?: string;
    }) => {
      const updates: LeadUpdate = { status };
      
      if (status === "interesse_outros" && servico_interesse) {
        updates.servico_interesse = servico_interesse;
      }
      
      if (status === "ganho") {
        if (valor_ganho !== undefined) updates.valor_ganho = valor_ganho;
        if (servico_realizado) updates.servico_realizado = servico_realizado;
      }

      const { data, error } = await supabase
        .from("leads")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const assignVendedor = useMutation({
    mutationFn: async ({ leadId, vendedorId }: { leadId: string; vendedorId: string | null }) => {
      const { data, error } = await supabase
        .from("leads")
        .update({ vendedor_id: vendedorId })
        .eq("id", leadId)
        .select()
        .single();

      if (error) {
        console.error("Erro ao atribuir vendedor:", error.message);
        throw new Error(`Falha ao atribuir vendedor: ${error.message}`);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Erro ao deletar lead:", error.message);
        throw new Error(`Falha ao deletar lead: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  // Estatísticas
  const stats = {
    total: leadsQuery.data?.length ?? 0,
    porStatus: {
      novo_lead: leadsQuery.data?.filter(l => l.status === "novo_lead").length ?? 0,
      em_atendimento: leadsQuery.data?.filter(l => l.status === "em_atendimento").length ?? 0,
      finalizado: leadsQuery.data?.filter(l => l.status === "finalizado").length ?? 0,
      interesse_outros: leadsQuery.data?.filter(l => l.status === "interesse_outros").length ?? 0,
      ganho: leadsQuery.data?.filter(l => l.status === "ganho").length ?? 0,
    },
    valorTotalGanho: leadsQuery.data
      ?.filter(l => l.status === "ganho" && l.valor_ganho)
      .reduce((acc, l) => acc + (Number(l.valor_ganho) || 0), 0) ?? 0,
  };

  return {
    leads: leadsQuery.data ?? [],
    isLoading: leadsQuery.isLoading,
    error: leadsQuery.error,
    stats,
    createLead,
    updateLead,
    updateLeadStatus,
    assignVendedor,
    deleteLead,
    refetch: leadsQuery.refetch,
  };
}

// Hook para criar lead público (formulário de obrigado)
export function useCreatePublicLead() {
  return useMutation({
    mutationFn: async (lead: LeadInsert) => {
      // IMPORTANT: do not request the inserted row back.
      // The public thank-you page is allowed to INSERT, but must NOT be allowed to SELECT.
      const { error } = await supabase.from("leads").insert(lead);
      if (error) throw error;
      return { ok: true } as const;
    },
  });
}
