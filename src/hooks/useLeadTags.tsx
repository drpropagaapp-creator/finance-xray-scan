import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface LeadServiceTag {
  id: string;
  lead_id: string;
  service_id: string;
  created_at: string;
}

interface LeadServicoVendido {
  id: string;
  lead_id: string;
  service_id: string;
  valor: number | null;
  created_at: string;
}

export function useLeadTags() {
  const { user, isAdmin, isVendedor } = useAuth();
  const queryClient = useQueryClient();

  // Tags de interesse (para "Interesse Outros")
  const tagsQuery = useQuery({
    queryKey: ["lead-service-tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_service_tags")
        .select("*");

      if (error) throw error;
      return data as LeadServiceTag[];
    },
    enabled: !!user && (isAdmin || isVendedor),
  });

  // Serviços vendidos (para "Ganho")
  const servicosVendidosQuery = useQuery({
    queryKey: ["lead-servicos-vendidos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_servicos_vendidos")
        .select("*");

      if (error) throw error;
      return data as LeadServicoVendido[];
    },
    enabled: !!user && (isAdmin || isVendedor),
  });

  const addTagToLead = useMutation({
    mutationFn: async ({ lead_id, service_id }: { lead_id: string; service_id: string }) => {
      const { data, error } = await supabase
        .from("lead_service_tags")
        .insert({ lead_id, service_id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-service-tags"] });
    },
  });

  const removeTagFromLead = useMutation({
    mutationFn: async ({ lead_id, service_id }: { lead_id: string; service_id: string }) => {
      const { error } = await supabase
        .from("lead_service_tags")
        .delete()
        .eq("lead_id", lead_id)
        .eq("service_id", service_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-service-tags"] });
    },
  });

  const setLeadTags = useMutation({
    mutationFn: async ({ lead_id, service_ids }: { lead_id: string; service_ids: string[] }) => {
      // Remover tags existentes
      const { error: deleteError } = await supabase
        .from("lead_service_tags")
        .delete()
        .eq("lead_id", lead_id);

      if (deleteError) throw deleteError;

      // Inserir novas tags
      if (service_ids.length > 0) {
        const inserts = service_ids.map(service_id => ({ lead_id, service_id }));
        const { error: insertError } = await supabase
          .from("lead_service_tags")
          .insert(inserts);

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-service-tags"] });
    },
  });

  const addServicoVendido = useMutation({
    mutationFn: async ({ lead_id, service_id, valor }: { lead_id: string; service_id: string; valor?: number }) => {
      const { data, error } = await supabase
        .from("lead_servicos_vendidos")
        .insert({ lead_id, service_id, valor: valor ?? null })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-servicos-vendidos"] });
    },
  });

  const setServicosVendidos = useMutation({
    mutationFn: async ({ lead_id, servicos }: { lead_id: string; servicos: { service_id: string; valor?: number }[] }) => {
      // Remover serviços existentes
      const { error: deleteError } = await supabase
        .from("lead_servicos_vendidos")
        .delete()
        .eq("lead_id", lead_id);

      if (deleteError) throw deleteError;

      // Inserir novos serviços
      if (servicos.length > 0) {
        const inserts = servicos.map(s => ({ lead_id, service_id: s.service_id, valor: s.valor ?? null }));
        const { error: insertError } = await supabase
          .from("lead_servicos_vendidos")
          .insert(inserts);

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-servicos-vendidos"] });
    },
  });

  const getTagsForLead = (leadId: string) => {
    return (tagsQuery.data ?? []).filter(t => t.lead_id === leadId);
  };

  const getServicosVendidosForLead = (leadId: string) => {
    return (servicosVendidosQuery.data ?? []).filter(s => s.lead_id === leadId);
  };

  return {
    tags: tagsQuery.data ?? [],
    servicosVendidos: servicosVendidosQuery.data ?? [],
    isLoading: tagsQuery.isLoading || servicosVendidosQuery.isLoading,
    addTagToLead,
    removeTagFromLead,
    setLeadTags,
    addServicoVendido,
    setServicosVendidos,
    getTagsForLead,
    getServicosVendidosForLead,
  };
}
