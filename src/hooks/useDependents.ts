import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ClientDependent {
  id: string;
  client_id: string;
  unit_id: string;
  company_id: string | null;
  name: string;
  birth_date: string | null;
  relationship: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDependentData {
  client_id: string;
  name: string;
  birth_date?: string | null;
  relationship?: string | null;
  notes?: string | null;
}

export interface UpdateDependentData {
  id: string;
  name?: string;
  birth_date?: string | null;
  relationship?: string | null;
  notes?: string | null;
}

export function useDependents(clientId: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["client-dependents", clientId],
    queryFn: async () => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from("client_dependents")
        .select("*")
        .eq("client_id", clientId)
        .order("name", { ascending: true });

      if (error) throw error;
      return data as ClientDependent[];
    },
    enabled: !!clientId,
  });

  const createDependent = useMutation({
    mutationFn: async (data: CreateDependentData) => {
      // Get client's unit_id and company_id
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("unit_id, company_id")
        .eq("id", data.client_id)
        .single();

      if (clientError || !client) {
        throw new Error("Cliente não encontrado");
      }

      const { data: dependent, error } = await supabase
        .from("client_dependents")
        .insert({
          client_id: data.client_id,
          unit_id: client.unit_id,
          company_id: client.company_id,
          name: data.name,
          birth_date: data.birth_date || null,
          relationship: data.relationship || null,
          notes: data.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return dependent as ClientDependent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-dependents", clientId] });
      toast({ title: "Dependente adicionado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar dependente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateDependent = useMutation({
    mutationFn: async (data: UpdateDependentData) => {
      const { id, ...updateData } = data;
      const { error } = await supabase
        .from("client_dependents")
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-dependents", clientId] });
      toast({ title: "Dependente atualizado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar dependente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteDependent = useMutation({
    mutationFn: async (dependentId: string) => {
      const { error } = await supabase
        .from("client_dependents")
        .delete()
        .eq("id", dependentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-dependents", clientId] });
      toast({ title: "Dependente removido com sucesso!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover dependente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    dependents: query.data || [],
    isLoading: query.isLoading,
    createDependent,
    updateDependent,
    deleteDependent,
  };
}

// Hook to fetch all dependents for a unit (for appointment forms)
export function useUnitDependents(unitId: string | null) {
  return useQuery({
    queryKey: ["unit-dependents", unitId],
    queryFn: async () => {
      if (!unitId) return [];

      const { data, error } = await supabase
        .from("client_dependents")
        .select(`
          *,
          client:clients(id, name, phone)
        `)
        .eq("unit_id", unitId)
        .order("name", { ascending: true });

      if (error) throw error;
      return data as (ClientDependent & { client: { id: string; name: string; phone: string } })[];
    },
    enabled: !!unitId,
  });
}
