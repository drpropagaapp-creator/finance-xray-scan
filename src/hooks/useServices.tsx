import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Service {
  id: string;
  nome: string;
  ativo: boolean;
  created_at: string;
}

export function useServices() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const servicesQuery = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("nome", { ascending: true });

      if (error) throw error;
      return data as Service[];
    },
    enabled: !!user,
  });

  const createService = useMutation({
    mutationFn: async (nome: string) => {
      const { data, error } = await supabase
        .from("services")
        .insert({ nome })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });

  const updateService = useMutation({
    mutationFn: async ({ id, nome, ativo }: { id: string; nome?: string; ativo?: boolean }) => {
      const updates: Partial<Service> = {};
      if (nome !== undefined) updates.nome = nome;
      if (ativo !== undefined) updates.ativo = ativo;

      const { data, error } = await supabase
        .from("services")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });

  return {
    services: servicesQuery.data ?? [],
    activeServices: (servicesQuery.data ?? []).filter(s => s.ativo),
    isLoading: servicesQuery.isLoading,
    error: servicesQuery.error,
    createService,
    updateService,
    deleteService,
    refetch: servicesQuery.refetch,
  };
}
