import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/supabase';

type Noticia = Tables<'noticias'>;

export function useNoticias(limit?: number) {
  return useQuery({
    queryKey: ['noticias', limit],
    queryFn: async (): Promise<Noticia[]> => {
      let query = supabase
        .from('noticias')
        .select('*')
        .eq('publicado', true)
        .order('created_at', { ascending: false });
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Noticia[];
    },
  });
}
