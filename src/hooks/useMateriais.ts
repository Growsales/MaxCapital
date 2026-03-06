import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/supabase';

type Material = Tables<'materiais'>;

export function useMateriais(filters?: {
  searchQuery?: string;
  categoria?: string;
}) {
  return useQuery({
    queryKey: ['materiais', filters],
    queryFn: async (): Promise<Material[]> => {
      let query = supabase
        .from('materiais')
        .select('*')
        .order('atualizado_em', { ascending: false });
      
      if (filters?.categoria) {
        query = query.eq('categoria', filters.categoria);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      let result = (data || []) as Material[];
      
      // Apply search filter on client side
      if (filters?.searchQuery) {
        result = result.filter(m => 
          m.nome.toLowerCase().includes(filters.searchQuery!.toLowerCase())
        );
      }
      
      return result;
    },
  });
}

export function useIncrementDownload() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (materialId: string): Promise<Material> => {
      const { data: material, error: fetchError } = await supabase
        .from('materiais')
        .select('downloads')
        .eq('id', materialId)
        .single();
      
      if (fetchError) throw fetchError;
      if (!material) throw new Error('Material não encontrado');
      
      const { data, error } = await supabase
        .from('materiais')
        .update({ downloads: (material.downloads || 0) + 1 } as any)
        .eq('id', materialId)
        .select()
        .single();
      
      if (error) throw error;
      return data as Material;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiais'] });
    },
  });
}
