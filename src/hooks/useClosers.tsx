import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Closer {
  id: string;
  vendedor_id: string;
  nome: string;
  ativo: boolean;
  created_at: string;
}

export function useClosers() {
  const { user, isAdmin, isVendedor } = useAuth();
  const queryClient = useQueryClient();

  const closersQuery = useQuery({
    queryKey: ["closers", user?.id],
    queryFn: async () => {
      let query = supabase.from("closers").select("*").order("nome", { ascending: true });

      // Vendedor só vê seus próprios closers
      if (isVendedor && !isAdmin) {
        query = query.eq("vendedor_id", user?.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Closer[];
    },
    enabled: !!user && (isAdmin || isVendedor),
  });

  const createCloser = useMutation({
    mutationFn: async ({ nome }: { nome: string }) => {
      const { data, error } = await supabase
        .from("closers")
        .insert({
          nome,
          vendedor_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["closers"] });
    },
  });

  const updateCloser = useMutation({
    mutationFn: async ({ id, nome, ativo }: { id: string; nome?: string; ativo?: boolean }) => {
      const updates: Partial<Closer> = {};
      if (nome !== undefined) updates.nome = nome;
      if (ativo !== undefined) updates.ativo = ativo;

      const { data, error } = await supabase
        .from("closers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["closers"] });
    },
  });

  const deleteCloser = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("closers")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["closers"] });
    },
  });

  return {
    closers: closersQuery.data ?? [],
    activeClosers: (closersQuery.data ?? []).filter(c => c.ativo),
    isLoading: closersQuery.isLoading,
    error: closersQuery.error,
    createCloser,
    updateCloser,
    deleteCloser,
    refetch: closersQuery.refetch,
  };
}
