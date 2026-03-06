import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/supabase';

type MembroRede = Tables<'membros_rede'>;
type Profile = Tables<'profiles'>;

interface MembroRedeWithUsuario extends MembroRede {
  usuario?: Pick<Profile, 'id' | 'nome' | 'email' | 'avatar_url'>;
}

interface RedeStats {
  totalIndicados: number;
  indicacoesDiretas: number;
  totalNegocios: number;
  valorTotal: number;
  ativos: number;
}

export function useMembrosRede(searchQuery?: string) {
  return useQuery({
    queryKey: ['membros-rede', searchQuery],
    queryFn: async (): Promise<MembroRedeWithUsuario[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('membros_rede')
        .select(`
          *,
          usuario:profiles!usuario_id(id, nome, email, telefone, avatar_url)
        `)
        .order('valor_total', { ascending: false });
      
      if (error) throw error;
      
      let result = (data || []) as MembroRedeWithUsuario[];
      
      // Apply search filter on client side for user name
      if (searchQuery) {
        result = result.filter(m => 
          m.usuario?.nome?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      return result;
    },
  });
}

export function useRedeStats() {
  return useQuery({
    queryKey: ['rede-stats'],
    queryFn: async (): Promise<RedeStats> => {
      const { data, error } = await supabase
        .from('membros_rede')
        .select('indicacao, numero_negocios, valor_total, status');
      
      if (error) throw error;
      
      const membros = (data || []) as Pick<MembroRede, 'indicacao' | 'numero_negocios' | 'valor_total' | 'status'>[];
      
      return {
        totalIndicados: membros.length,
        indicacoesDiretas: membros.filter(m => m.indicacao === 'Direta').length,
        totalNegocios: membros.reduce((acc, m) => acc + (m.numero_negocios || 0), 0),
        valorTotal: membros.reduce((acc, m) => acc + (m.valor_total || 0), 0),
        ativos: membros.filter(m => m.status === 'Ativo').length,
      };
    },
  });
}
