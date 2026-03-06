import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/supabase';

type Empresa = Tables<'empresas'>;

interface EmpresaWithResponsavel extends Empresa {
  responsavel?: {
    nome: string;
    email: string;
  };
}

export function useEmpresas(filters?: {
  searchQuery?: string;
  userId?: string;
  segmento?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ['empresas', filters],
    queryFn: async (): Promise<EmpresaWithResponsavel[]> => {
      let query = supabase
        .from('empresas')
        .select('*, responsavel:profiles!responsavel_id(nome, email)')
        .order('created_at', { ascending: false });

      // Filter by user (responsavel_id)
      if (filters?.userId) {
        query = query.eq('responsavel_id', filters.userId);
      }

      // Filter by segment
      if (filters?.segmento) {
        query = query.eq('segmento', filters.segmento);
      }

      if (filters?.searchQuery) {
        query = query.ilike('nome', `%${filters.searchQuery}%`);
      }

      // Apply pagination if provided
      if (filters?.page && filters?.pageSize) {
        const offset = (filters.page - 1) * filters.pageSize;
        query = query.range(offset, offset + filters.pageSize - 1);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as EmpresaWithResponsavel[];
    },
    enabled: !!filters?.userId, // Only fetch when userId is available
  });
}

export function useEmpresa(id?: string) {
  return useQuery({
    queryKey: ['empresa', id],
    queryFn: async (): Promise<Empresa | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('empresas')
        .select('*, responsavel:profiles!responsavel_id(*)')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as Empresa | null;
    },
    enabled: !!id,
  });
}

export function useCreateEmpresa() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (empresa: Omit<Empresa, 'id' | 'created_at' | 'updated_at'>): Promise<Empresa> => {
      const { data, error } = await supabase
        .from('empresas')
        .insert(empresa as any)
        .select()
        .single();
      if (error) throw error;
      return data as Empresa;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
    },
  });
}

export function useUpdateEmpresa() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Empresa> & { id: string }): Promise<Empresa> => {
      const { data, error } = await supabase
        .from('empresas')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Empresa;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      queryClient.invalidateQueries({ queryKey: ['empresa', data.id] });
    },
  });
}

export function useDeleteEmpresa() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
    },
  });
}
