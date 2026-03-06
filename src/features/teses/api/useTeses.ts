import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Extended Tese type with additional fields
export interface TeseFull {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  categoria: string;
  valor_min: number;
  valor_max: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  // Extended fields
  setores?: string[];
  modelo_negocio?: string;
  fase_investimento?: string;
  faturamento_min?: number;
  faturamento_max?: number;
  ebitda_min?: number;
  ebitda_max?: number;
  publico_alvo?: string;
  regioes?: string[];
  tipo_transacao?: string[];
  localizacao?: string;
  categoria_investidor?: string;
  informacoes_adicionais?: string[];
  tese_quente?: boolean;
  image_url?: string;
  investidor_id?: string;
  investidor?: { id: string; nome: string; avatar_url?: string | null };
}

export function useTesesInvestimento(filters?: {
  searchQuery?: string;
  categoria?: string;
}) {
  return useQuery({
    queryKey: ['teses', filters],
    queryFn: async (): Promise<TeseFull[]> => {
      let query = supabase
        .from('teses_investimento')
        .select('*')
        .eq('ativo', true)
        .order('created_at', { ascending: false });
      
      if (filters?.categoria) {
        query = query.eq('categoria', filters.categoria);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      let result = (data || []) as TeseFull[];
      
      // Enrich with investor profile data
      const investidorIds = [...new Set(result.map(t => t.investidor_id).filter(Boolean))];
      if (investidorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, nome, avatar_url')
          .in('id', investidorIds);
        
        if (profiles) {
          const profileMap = new Map<string, { id: string; nome: string; avatar_url?: string | null }>(
            profiles.map((p: any) => [p.id, { id: p.id, nome: p.nome, avatar_url: p.avatar_url }])
          );
          result = result.map(t => ({
            ...t,
            investidor: t.investidor_id ? profileMap.get(t.investidor_id) || undefined : undefined,
          }));
        }
      }
      
      // Apply search filter on client side
      if (filters?.searchQuery) {
        const search = filters.searchQuery.toLowerCase();
        result = result.filter(t => 
          t.titulo.toLowerCase().includes(search) ||
          t.descricao.toLowerCase().includes(search) ||
          t.id.toLowerCase().includes(search)
        );
      }
      
      return result;
    },
  });
}

export function useTese(id: string | undefined) {
  return useQuery({
    queryKey: ['tese', id],
    queryFn: async (): Promise<TeseFull | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('teses_investimento')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as TeseFull | null;
    },
    enabled: !!id,
  });
}
