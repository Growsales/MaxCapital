import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type PrioridadeChamado = 'baixa' | 'media' | 'alta' | 'urgente';
export type StatusChamado = 'aberto' | 'em_andamento' | 'aguardando_usuario' | 'resolvido' | 'fechado';
export type CategoriaChamado = 
  | 'duvida' | 'problema_tecnico' | 'solicitacao_cadastro'
  | 'erro_sistema' | 'duvida_financeira' | 'sugestao' | 'outros';

export interface Chamado {
  id: string;
  numero_chamado: string;
  usuario_id: string;
  categoria: CategoriaChamado;
  prioridade: PrioridadeChamado;
  status: StatusChamado;
  assunto: string;
  descricao: string;
  anexos: string[] | null;
  atribuido_a: string | null;
  resolvido_por: string | null;
  created_at: string;
  updated_at: string;
  primeira_resposta_em: string | null;
  resolvido_em: string | null;
  fechado_em: string | null;
  avaliacao: number | null;
  feedback: string | null;
  // Joined data
  usuario?: {
    id: string;
    nome: string;
    email: string;
    avatar_url: string | null;
  };
  atribuido?: {
    id: string;
    cargo: string | null;
    profiles: {
      nome: string;
    };
  } | null;
}

export interface ChamadoResposta {
  id: string;
  chamado_id: string;
  autor_id: string;
  is_admin: boolean;
  mensagem: string;
  anexos: string[] | null;
  interno: boolean;
  created_at: string;
  autor?: {
    id: string;
    nome: string;
    avatar_url: string | null;
  };
}

interface CreateChamadoData {
  categoria: CategoriaChamado;
  assunto: string;
  descricao: string;
  prioridade?: PrioridadeChamado;
  anexos?: string[];
}

interface CreateRespostaData {
  chamado_id: string;
  mensagem: string;
  interno?: boolean;
  anexos?: string[];
}

export function useChamados(isAdmin = false) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's chamados (for regular users)
  const { data: meusChamados, isLoading: isLoadingMeus } = useQuery({
    queryKey: ['meus-chamados', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('chamados')
        .select(`
          *,
          usuario:profiles!chamados_usuario_id_fkey(id, nome, email, avatar_url)
        `)
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching chamados:', error);
        return [];
      }

      return data as Chamado[];
    },
    enabled: !!user?.id && !isAdmin,
  });

  // Fetch all chamados (for admins)
  const { data: todosChamados, isLoading: isLoadingTodos } = useQuery({
    queryKey: ['todos-chamados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chamados')
        .select(`
          *,
          usuario:profiles!chamados_usuario_id_fkey(id, nome, email, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all chamados:', error);
        return [];
      }

      return data as Chamado[];
    },
    enabled: isAdmin,
  });

  // Fetch chamado details with respostas
  const useChamadoDetails = (chamadoId: string | undefined) => {
    return useQuery({
      queryKey: ['chamado-details', chamadoId],
      queryFn: async () => {
        if (!chamadoId) return null;

        const [chamadoResult, respostasResult] = await Promise.all([
          supabase
            .from('chamados')
            .select(`
              *,
              usuario:profiles!chamados_usuario_id_fkey(id, nome, email, avatar_url)
            `)
            .eq('id', chamadoId)
            .single(),
          supabase
            .from('chamados_respostas')
            .select(`
              *,
              autor:profiles!chamados_respostas_autor_id_fkey(id, nome, avatar_url)
            `)
            .eq('chamado_id', chamadoId)
            .order('created_at', { ascending: true }),
        ]);

        if (chamadoResult.error) {
          console.error('Error fetching chamado:', chamadoResult.error);
          return null;
        }

        return {
          chamado: chamadoResult.data as Chamado,
          respostas: (respostasResult.data || []) as ChamadoResposta[],
        };
      },
      enabled: !!chamadoId,
    });
  };

  // Create chamado
  const createChamado = useMutation({
    mutationFn: async (data: CreateChamadoData) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      // Generate a temporary numero_chamado if trigger doesn't exist
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      const fallbackNumero = `CHM-${timestamp}-${random}`;

      const { data: chamado, error } = await supabase
        .from('chamados')
        .insert({
          usuario_id: user.id,
          categoria: data.categoria,
          assunto: data.assunto,
          descricao: data.descricao,
          prioridade: data.prioridade || 'media',
          anexos: data.anexos || [],
          numero_chamado: fallbackNumero, // Fallback if trigger doesn't set it
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating chamado:', error);
        throw error;
      }
      return chamado;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meus-chamados'] });
      queryClient.invalidateQueries({ queryKey: ['todos-chamados'] });
      queryClient.invalidateQueries({ queryKey: ['chamados-open-count'] });
      toast.success('Chamado criado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error creating chamado:', error);
      toast.error(`Erro ao criar chamado: ${error.message}`);
    },
  });

  // Add resposta
  const addResposta = useMutation({
    mutationFn: async ({ chamado_id, mensagem, interno = false, anexos = [] }: CreateRespostaData) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      // Check if user is admin
      const { data: adminCheck } = await supabase
        .from('admin_equipe')
        .select('id')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .maybeSingle();

      const { data, error } = await supabase
        .from('chamados_respostas')
        .insert({
          chamado_id,
          autor_id: user.id,
          mensagem,
          is_admin: !!adminCheck,
          interno,
          anexos,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chamado-details', variables.chamado_id] });
      queryClient.invalidateQueries({ queryKey: ['meus-chamados'] });
      queryClient.invalidateQueries({ queryKey: ['todos-chamados'] });
      toast.success('Resposta enviada!');
    },
    onError: (error) => {
      console.error('Error adding resposta:', error);
      toast.error('Erro ao enviar resposta');
    },
  });

  // Update chamado status (admin only)
  const updateChamadoStatus = useMutation({
    mutationFn: async ({ chamadoId, status, atribuido_a }: { 
      chamadoId: string; 
      status?: StatusChamado;
      atribuido_a?: string;
    }) => {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (status) {
        updateData.status = status;
        if (status === 'resolvido') {
          updateData.resolvido_em = new Date().toISOString();
        }
        if (status === 'fechado') {
          updateData.fechado_em = new Date().toISOString();
        }
      }

      if (atribuido_a) {
        updateData.atribuido_a = atribuido_a;
      }

      const { data, error } = await supabase
        .from('chamados')
        .update(updateData)
        .eq('id', chamadoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chamado-details', variables.chamadoId] });
      queryClient.invalidateQueries({ queryKey: ['todos-chamados'] });
      toast.success('Chamado atualizado!');
    },
    onError: (error) => {
      console.error('Error updating chamado:', error);
      toast.error('Erro ao atualizar chamado');
    },
  });

  // Count open chamados for badge
  const { data: openCount = 0 } = useQuery({
    queryKey: ['chamados-open-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from('chamados')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', user.id)
        .in('status', ['aberto', 'em_andamento', 'aguardando_usuario']);

      if (error) {
        console.error('Error counting chamados:', error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!user?.id,
  });

  return {
    chamados: isAdmin ? todosChamados : meusChamados,
    isLoading: isAdmin ? isLoadingTodos : isLoadingMeus,
    openCount,
    useChamadoDetails,
    createChamado,
    addResposta,
    updateChamadoStatus,
  };
}
