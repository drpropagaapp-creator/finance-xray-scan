import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface DistributionConfig {
  id: string;
  enabled: boolean;
  distribution_mode: string;
  last_assigned_vendedor_id: string | null;
  created_at: string;
  updated_at: string;
}

interface VendedorDistribution {
  id: string;
  vendedor_id: string;
  active: boolean;
  priority: number;
  created_at: string;
}

export function useLeadDistribution() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const configQuery = useQuery({
    queryKey: ["lead-distribution-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_distribution_config")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as DistributionConfig | null;
    },
    enabled: isAdmin,
  });

  const vendedorDistributionQuery = useQuery({
    queryKey: ["vendedor-distribution"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendedor_distribution")
        .select("*")
        .order("priority", { ascending: true });

      if (error) throw error;
      return data as VendedorDistribution[];
    },
    enabled: isAdmin,
  });

  const updateConfig = useMutation({
    mutationFn: async ({ enabled, distribution_mode }: { enabled?: boolean; distribution_mode?: string }) => {
      const config = configQuery.data;
      if (!config) {
        // Criar se não existir
        const { data, error } = await supabase
          .from("lead_distribution_config")
          .insert({
            enabled: enabled ?? false,
            distribution_mode: distribution_mode ?? "round_robin",
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      const updates: Partial<DistributionConfig> = {};
      if (enabled !== undefined) updates.enabled = enabled;
      if (distribution_mode !== undefined) updates.distribution_mode = distribution_mode;

      const { data, error } = await supabase
        .from("lead_distribution_config")
        .update(updates)
        .eq("id", config.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-distribution-config"] });
    },
  });

  const addVendedorToDistribution = useMutation({
    mutationFn: async ({ vendedor_id, priority = 0 }: { vendedor_id: string; priority?: number }) => {
      const { data, error } = await supabase
        .from("vendedor_distribution")
        .insert({
          vendedor_id,
          priority,
          active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendedor-distribution"] });
    },
  });

  const updateVendedorDistribution = useMutation({
    mutationFn: async ({ id, active, priority }: { id: string; active?: boolean; priority?: number }) => {
      const updates: Partial<VendedorDistribution> = {};
      if (active !== undefined) updates.active = active;
      if (priority !== undefined) updates.priority = priority;

      const { data, error } = await supabase
        .from("vendedor_distribution")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendedor-distribution"] });
    },
  });

  const removeVendedorFromDistribution = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("vendedor_distribution")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendedor-distribution"] });
    },
  });

  return {
    config: configQuery.data,
    vendedorDistributions: vendedorDistributionQuery.data ?? [],
    isLoading: configQuery.isLoading || vendedorDistributionQuery.isLoading,
    updateConfig,
    addVendedorToDistribution,
    updateVendedorDistribution,
    removeVendedorFromDistribution,
    refetch: () => {
      configQuery.refetch();
      vendedorDistributionQuery.refetch();
    },
  };
}
