import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Tables, EtapaPipeline } from '@/types/supabase';

type Operacao = Tables<'operacoes'>;
type Empresa = Tables<'empresas'>;
type Profile = Tables<'profiles'>;

interface OperacaoWithRelations extends Operacao {
  empresa?: Pick<Empresa, 'id' | 'nome' | 'cnpj' | 'segmento'>;
  responsavel?: Pick<Profile, 'id' | 'nome' | 'email' | 'avatar_url'>;
}

interface OperacoesStats {
  totalNegocios: number;
  valorTotal: number;
  negociosConcluidos: number;
  taxaConversao: number;
}

interface StageStats {
  prospeccao: number;
  comite: number;
  comercial: number;
  clienteAtivo: number;
  matchmaking: number;
  preparacao: number;
  apresentacao: number;
  negociacoes: number;
  concluido: number;
  reprovadas: number;
  clienteInativo: number;
}

export function useOperacoes(filters?: {
  searchQuery?: string;
  etapa?: EtapaPipeline;
  responsavelId?: string;
  userId?: string; // Filter by logged-in user
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ['operacoes', filters],
    queryFn: async (): Promise<OperacaoWithRelations[]> => {
      let query = supabase
        .from('operacoes')
        .select(`
          *,
          empresa:empresas(id, nome, cnpj, segmento),
          responsavel:profiles!responsavel_id(id, nome, email, avatar_url)
        `)
        .order('ultima_movimentacao', { ascending: false });

      // Filter by user (responsavel_id) - each user sees only their operations
      if (filters?.userId) {
        query = query.eq('responsavel_id', filters.userId);
      }

      if (filters?.etapa) {
        query = query.eq('etapa_atual', filters.etapa);
      }

      if (filters?.responsavelId) {
        query = query.eq('responsavel_id', filters.responsavelId);
      }

      // Apply pagination if provided
      if (filters?.page && filters?.pageSize) {
        const offset = (filters.page - 1) * filters.pageSize;
        query = query.range(offset, offset + filters.pageSize - 1);
      }

      const { data, error } = await query;
      if (error) throw error;

      let result = (data || []) as OperacaoWithRelations[];

      // Client-side search filter (kept for backward compatibility, prefer server-side)
      if (filters?.searchQuery) {
        const search = filters.searchQuery.toLowerCase();
        result = result.filter(op =>
          op.numero_funil.toLowerCase().includes(search) ||
          op.empresa?.nome?.toLowerCase().includes(search)
        );
      }

      return result;
    },
    enabled: !!filters, // Fetch when filters are provided (userId is optional for admins)
  });
}

export function useOperacao(id?: string) {
  return useQuery({
    queryKey: ['operacao', id],
    queryFn: async (): Promise<OperacaoWithRelations | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('operacoes')
        .select(`
          *,
          empresa:empresas(*),
          responsavel:profiles!responsavel_id(*)
        `)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as OperacaoWithRelations | null;
    },
    enabled: !!id,
  });
}

interface MonthlyStats {
  month: string;
  quantidade: number;
  valor: number;
}

export function useOperacoesStats(userId?: string) {
  return useQuery({
    queryKey: ['operacoes-stats', userId],
    queryFn: async (): Promise<{ stats: OperacoesStats; stageStats: StageStats; monthlyStats: MonthlyStats[] }> => {
      let query = supabase
        .from('operacoes')
        .select('etapa_atual, valor_investimento, lead_tag, created_at');
      
      // Filter by user if provided
      if (userId) {
        query = query.eq('responsavel_id', userId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      const operacoes = (data || []) as Pick<Operacao, 'etapa_atual' | 'valor_investimento' | 'lead_tag' | 'created_at'>[];
      
      const stats: OperacoesStats = {
        totalNegocios: operacoes.length,
        valorTotal: operacoes.reduce((acc, op) => acc + (op.valor_investimento || 0), 0),
        negociosConcluidos: operacoes.filter(op => op.etapa_atual === 'Concluído').length,
        taxaConversao: operacoes.length > 0 
          ? (operacoes.filter(op => op.etapa_atual === 'Concluído').length / operacoes.length) * 100 
          : 0,
      };
      
      const stageStats: StageStats = {
        prospeccao: operacoes.filter(op => op.etapa_atual === 'Prospecto').length,
        comite: operacoes.filter(op => op.etapa_atual === 'Comitê').length,
        comercial: operacoes.filter(op => op.etapa_atual === 'Comercial').length,
        clienteAtivo: operacoes.filter(op => op.etapa_atual === 'Cliente Ativo').length,
        matchmaking: operacoes.filter(op => op.etapa_atual === 'Matchmaking').length,
        preparacao: operacoes.filter(op => op.etapa_atual === 'Estruturação').length,
        apresentacao: operacoes.filter(op => op.etapa_atual === 'Apresentação').length,
        negociacoes: operacoes.filter(op => op.etapa_atual === 'Negociação').length,
        concluido: operacoes.filter(op => op.etapa_atual === 'Concluído').length,
        reprovadas: 0,
        clienteInativo: 0,
      };
      
      // Calculate monthly stats
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const currentYear = new Date().getFullYear();
      const monthlyMap = new Map<number, { quantidade: number; valor: number }>();
      
      operacoes.forEach(op => {
        if (op.created_at) {
          const date = new Date(op.created_at);
          if (date.getFullYear() === currentYear) {
            const month = date.getMonth();
            const existing = monthlyMap.get(month) || { quantidade: 0, valor: 0 };
            monthlyMap.set(month, {
              quantidade: existing.quantidade + 1,
              valor: existing.valor + (op.valor_investimento || 0),
            });
          }
        }
      });
      
      // Get last 6 months
      const currentMonth = new Date().getMonth();
      const monthlyStats: MonthlyStats[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        const data = monthlyMap.get(monthIndex) || { quantidade: 0, valor: 0 };
        monthlyStats.push({
          month: monthNames[monthIndex],
          quantidade: data.quantidade,
          valor: data.valor,
        });
      }
      
      return { stats, stageStats, monthlyStats };
    },
  });
}

export function useCreateOperacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (operacao: Omit<Operacao, 'id' | 'created_at' | 'ultima_movimentacao' | 'dias_na_etapa' | 'dias_desde_atualizacao'>): Promise<Operacao> => {
      const { data, error } = await supabase
        .from('operacoes')
        .insert(operacao as any)
        .select()
        .single();
      if (error) throw error;
      return data as Operacao;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operacoes'] });
      queryClient.invalidateQueries({ queryKey: ['operacoes-stats'] });
    },
  });
}

export function useUpdateOperacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Operacao> & { id: string }): Promise<Operacao> => {
      const { data, error } = await supabase
        .from('operacoes')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Operacao;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['operacoes'] });
      queryClient.invalidateQueries({ queryKey: ['operacao', data.id] });
      queryClient.invalidateQueries({ queryKey: ['operacoes-stats'] });
    },
  });
}

export function useDeleteOperacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // First, delete related history records
      const { error: historyError } = await supabase
        .from('movimentacoes_historico')
        .delete()
        .eq('operacao_id', id);
      
      if (historyError) throw historyError;
      
      // Then delete the operation
      const { error } = await supabase
        .from('operacoes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operacoes'] });
      queryClient.invalidateQueries({ queryKey: ['operacoes-stats'] });
    },
  });
}

export function useMoveOperacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      operacaoId, 
      novaEtapa, 
      subEtapa,
      observacoes 
    }: { 
      operacaoId: string; 
      novaEtapa: EtapaPipeline; 
      subEtapa?: string;
      observacoes?: string;
    }): Promise<Operacao> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      // Get current operation
      const { data: operacao, error: fetchError } = await supabase
        .from('operacoes')
        .select('etapa_atual, sub_etapa')
        .eq('id', operacaoId)
        .single();
      
      if (fetchError) throw fetchError;
      if (!operacao) throw new Error('Operação não encontrada');
      
      // Create history record
      const { error: historyError } = await supabase
        .from('movimentacoes_historico')
        .insert({
          operacao_id: operacaoId,
          usuario_id: user.id,
          etapa_anterior: operacao.etapa_atual,
          sub_etapa_anterior: operacao.sub_etapa,
          etapa_nova: novaEtapa,
          sub_etapa_nova: subEtapa,
          observacoes,
        } as any);
      
      if (historyError) throw historyError;
      
      // Update operation
      const { data, error } = await supabase
        .from('operacoes')
        .update({
          etapa_atual: novaEtapa,
          sub_etapa: subEtapa,
          ultima_movimentacao: new Date().toISOString(),
          dias_na_etapa: 0,
        } as any)
        .eq('id', operacaoId)
        .select()
        .single();
      
      if (error) throw error;
      return data as Operacao;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operacoes'] });
      queryClient.invalidateQueries({ queryKey: ['operacoes-stats'] });
    },
  });
}

export function useOperacaoHistorico(operacaoId?: string) {
  return useQuery({
    queryKey: ['operacao-historico', operacaoId],
    queryFn: async () => {
      if (!operacaoId) return [];
      const { data, error } = await supabase
        .from('movimentacoes_historico')
        .select(`
          *,
          usuario:profiles!usuario_id(nome, avatar_url)
        `)
        .eq('operacao_id', operacaoId)
        .order('data_hora', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!operacaoId,
  });
}
