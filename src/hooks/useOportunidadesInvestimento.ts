import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/shared/hooks/useAuth';

export interface OportunidadeEmpresa {
  nome: string;
  descricao: string;
  experiencia: string;
  projetos: number;
  unidades_entregues: number;
}

export interface FinanceiroData {
  faturamento_2023: number;
  faturamento_2024: number;
  faturamento_2025: number;
  faturamento_2026: number;
  ebitda_2023: number;
  ebitda_2024: number;
  ebitda_2025: number;
  ebitda_2026: number;
}

export interface OportunidadeMilestone {
  label: string;
  completed: boolean;
  current: boolean;
}

export interface OportunidadeInvestimento {
  id: string;
  nome: string;
  tipo: string;
  segmento: string;
  instrumento: string;
  rentabilidade: number;
  investimento_minimo: number;
  prazo: number;
  pagamento: string;
  status: 'aberta' | 'encerrada' | 'captada';
  captado: number;
  alvo_minimo: number;
  alvo_maximo: number;
  investidores: number;
  data_inicio: string;
  data_fim: string;
  garantia: string;
  devedora: string;
  amortizacao: string;
  descricao: string;
  empresa: OportunidadeEmpresa;
  risco: string;
  financeiro: FinanceiroData;
  documentos: string[];
  image_url?: string;
  destaque?: boolean;
  operacao_origem_id?: string | null;
  milestones?: OportunidadeMilestone[];
  retorno_pessimista?: number;
  retorno_base?: number;
  retorno_otimista?: number;
  originador_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ManifestacaoInteresse {
  id: string;
  oportunidade_id: string;
  usuario_id: string;
  aceite_termos: boolean;
  created_at: string;
}

// Fetch all opportunities
export function useOportunidadesInvestimento() {
  return useQuery({
    queryKey: ['oportunidades-investimento'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('oportunidades_investimento')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as OportunidadeInvestimento[];
    },
  });
}

// Get Set of operation IDs that have linked opportunities (for filtering them out of Kanban)
export function useOportunidadesOrigemIds() {
  const { data: oportunidades } = useOportunidadesInvestimento();
  return useMemo(() => {
    const ids = new Set<string>();
    oportunidades?.forEach(o => {
      if (o.operacao_origem_id) ids.add(o.operacao_origem_id);
    });
    return ids;
  }, [oportunidades]);
}

// Fetch single opportunity
export function useOportunidadeInvestimento(id: string | undefined) {
  return useQuery({
    queryKey: ['oportunidade-investimento', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('oportunidades_investimento')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as OportunidadeInvestimento | null;
    },
    enabled: !!id,
  });
}

// Check if user has manifested interest
export function useManifestacaoInteresse(oportunidadeId: string | undefined) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['manifestacao-interesse', oportunidadeId, user?.id],
    queryFn: async () => {
      if (!oportunidadeId || !user?.id) return null;
      
      const { data, error } = await supabase
        .from('manifestacoes_interesse')
        .select('*')
        .eq('oportunidade_id', oportunidadeId)
        .eq('usuario_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as ManifestacaoInteresse | null;
    },
    enabled: !!oportunidadeId && !!user?.id,
  });
}

// Manifest interest in opportunity
export function useManifestInterest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (oportunidadeId: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('manifestacoes_interesse')
        .insert({
          oportunidade_id: oportunidadeId,
          usuario_id: user.id,
          investidor_id: user.id,
          aceite_termos: true,
          status: 'interessado',
          valor: 0,
        })
        .select()
        .single();

      if (error) throw error;

      // Increment investor count
      await supabase.rpc('increment_investidores', { oportunidade_id: oportunidadeId });

      return data;
    },
    onSuccess: (_, oportunidadeId) => {
      queryClient.invalidateQueries({ queryKey: ['manifestacao-interesse', oportunidadeId] });
      queryClient.invalidateQueries({ queryKey: ['oportunidade-investimento', oportunidadeId] });
      queryClient.invalidateQueries({ queryKey: ['oportunidades-investimento'] });
    },
  });
}

// Get stats for opportunities
export function useOportunidadesStats() {
  return useQuery({
    queryKey: ['oportunidades-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('oportunidades_investimento')
        .select('status, captado, investidores');

      if (error) throw error;

      const opportunities = data as OportunidadeInvestimento[];
      const abertas = opportunities.filter(o => o.status === 'aberta');
      const captadas = opportunities.filter(o => o.status === 'captada');

      return {
        ofertasAbertas: abertas.length,
        emCaptacao: abertas.reduce((acc, o) => acc + (o.captado || 0), 0),
        investidoresAtivos: opportunities.reduce((acc, o) => acc + (o.investidores || 0), 0),
        operacoesConcluidas: captadas.length,
      };
    },
  });
}
