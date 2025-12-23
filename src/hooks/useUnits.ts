import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Unit {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  user_id: string;
  created_at: string;
}

export function useUnits() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: units = [], isLoading } = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("units")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Unit[];
    },
  });

  const createUnit = useMutation({
    mutationFn: async (unit: { name: string; address?: string; phone?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("units")
        .insert({ ...unit, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast({ title: "Unidade criada com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar unidade", description: error.message, variant: "destructive" });
    },
  });

  return { units, isLoading, createUnit };
}
