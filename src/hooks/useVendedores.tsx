import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface UserWithRole {
  user_id: string;
  email: string;
  nome: string | null;
  role: "admin" | "vendedor";
  created_at: string;
}

export function useVendedores() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const vendedoresQuery = useQuery({
    queryKey: ["vendedores"],
    queryFn: async () => {
      // Buscar todos os usuários com role de vendedor e seus profiles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role, created_at")
        .eq("role", "vendedor");

      if (rolesError) throw rolesError;

      // Buscar profiles dos vendedores
      const userIds = (roles || []).map(r => r.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, email, nome")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      const vendedores: UserWithRole[] = (roles || []).map(roleData => {
        const profile = profileMap.get(roleData.user_id);
        return {
          user_id: roleData.user_id,
          email: profile?.email || "",
          nome: profile?.nome || null,
          role: roleData.role as "admin" | "vendedor",
          created_at: roleData.created_at || new Date().toISOString(),
        };
      });

      return vendedores;
    },
    enabled: isAdmin,
  });

  // Buscar todos os usuários (admins + vendedores) com profiles
  const allUsersQuery = useQuery({
    queryKey: ["all-users-roles"],
    queryFn: async () => {
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role, created_at");

      if (rolesError) throw rolesError;

      // Buscar todos os profiles
      const userIds = (roles || []).map(r => r.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, email, nome")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      return (roles || []).map(roleData => {
        const profile = profileMap.get(roleData.user_id);
        return {
          user_id: roleData.user_id,
          email: profile?.email || "",
          nome: profile?.nome || null,
          role: roleData.role as "admin" | "vendedor",
          created_at: roleData.created_at || new Date().toISOString(),
        };
      });
    },
    enabled: isAdmin,
  });

  const createVendedor = useMutation({
    mutationFn: async ({ email, password, nome }: { email: string; password: string; nome?: string }) => {
      // Usar Edge Function para criar vendedor sem afetar sessão do admin
      const { data, error } = await supabase.functions.invoke("create-vendedor", {
        body: { email, password, nome },
      });

      // Priorizar erro do body da resposta (mensagem customizada)
      if (data?.error) {
        throw new Error(data.error);
      }

      // Fallback para erro genérico do Supabase
      if (error) {
        throw new Error(error.message || "Erro ao criar vendedor");
      }

      if (!data?.success) {
        throw new Error("Erro desconhecido ao criar vendedor");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendedores"] });
      queryClient.invalidateQueries({ queryKey: ["all-users-roles"] });
    },
  });

  const deleteVendedor = useMutation({
    mutationFn: async (userId: string) => {
      // Remover role do vendedor
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "vendedor");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendedores"] });
      queryClient.invalidateQueries({ queryKey: ["all-users-roles"] });
    },
  });

  // Estatísticas de ganhos por vendedor
  const getGanhosPorVendedor = (leads: any[]) => {
    const ganhos: Record<string, { total: number; count: number }> = {};

    leads
      .filter(l => l.status === "ganho" && l.vendedor_id && l.valor_ganho)
      .forEach(l => {
        if (!ganhos[l.vendedor_id]) {
          ganhos[l.vendedor_id] = { total: 0, count: 0 };
        }
        ganhos[l.vendedor_id].total += Number(l.valor_ganho) || 0;
        ganhos[l.vendedor_id].count += 1;
      });

    return ganhos;
  };

  return {
    vendedores: vendedoresQuery.data ?? [],
    allUsers: allUsersQuery.data ?? [],
    isLoading: vendedoresQuery.isLoading,
    error: vendedoresQuery.error,
    createVendedor,
    deleteVendedor,
    getGanhosPorVendedor,
    refetch: vendedoresQuery.refetch,
  };
}
