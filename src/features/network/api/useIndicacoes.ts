import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/shared/hooks/useAuth';
import { useToast } from '@/shared/hooks/use-toast';

export interface Indicacao {
  id: string;
  indicador_id: string;
  indicado_id: string;
  nivel_indicacao: 1 | 2;
  indicacao_pai_id: string | null;
  codigo_convite: string;
  status: 'ativo' | 'inativo';
  data_indicacao: string;
  indicado?: {
    id: string;
    nome: string;
    email: string;
    avatar_url: string | null;
    created_at: string;
  };
  total_operacoes?: number;
  valor_gerado?: number;
}

export interface IndicacoesStats {
  totalDiretas: number;
  totalIndiretas: number;
  valorTotalGerado: number;
  operacoesTotais: number;
}

// Hook para buscar indicações do usuário logado
export function useMinhasIndicacoes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['minhas-indicacoes', user?.id],
    queryFn: async (): Promise<{ indicacoes: Indicacao[]; stats: IndicacoesStats }> => {
      if (!user?.id) {
        return { indicacoes: [], stats: { totalDiretas: 0, totalIndiretas: 0, valorTotalGerado: 0, operacoesTotais: 0 } };
      }

      // Buscar indicações com dados do indicado
      const { data: indicacoes, error } = await supabase
        .from('indicacoes')
        .select(`
          *,
          indicado:profiles!indicado_id(id, nome, email, avatar_url, created_at)
        `)
        .eq('indicador_id', user.id)
        .order('data_indicacao', { ascending: false });

      if (error) throw error;

      // Para cada indicado, buscar estatísticas de operações
      const indicacoesEnriquecidas = await Promise.all(
        (indicacoes || []).map(async (ind) => {
          // Buscar operações do indicado
          const { data: operacoes } = await supabase
            .from('operacoes')
            .select('valor_investimento')
            .eq('responsavel_id', ind.indicado_id);

          const totalOperacoes = operacoes?.length || 0;
          const valorGerado = operacoes?.reduce((acc, op) => acc + (op.valor_investimento || 0), 0) || 0;

          return {
            ...ind,
            total_operacoes: totalOperacoes,
            valor_gerado: valorGerado,
          };
        })
      );

      // Calcular estatísticas
      const diretas = indicacoesEnriquecidas.filter(i => i.nivel_indicacao === 1);
      const indiretas = indicacoesEnriquecidas.filter(i => i.nivel_indicacao === 2);
      
      const stats: IndicacoesStats = {
        totalDiretas: diretas.length,
        totalIndiretas: indiretas.length,
        valorTotalGerado: indicacoesEnriquecidas.reduce((acc, i) => acc + (i.valor_gerado || 0), 0),
        operacoesTotais: indicacoesEnriquecidas.reduce((acc, i) => acc + (i.total_operacoes || 0), 0),
      };

      return { indicacoes: indicacoesEnriquecidas, stats };
    },
    enabled: !!user?.id,
  });
}

// Hook para buscar código de convite do usuário
export function useCodigoConvite() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['codigo-convite', user?.id],
    queryFn: async (): Promise<string | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('codigo_convite_proprio')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data?.codigo_convite_proprio || null;
    },
    enabled: !!user?.id,
  });
}

// Helper para detectar dispositivo móvel
const isMobileDevice = () => {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Hook para compartilhar via WhatsApp
export function useCompartilharWhatsApp() {
  const { data: codigo } = useCodigoConvite();
  const { toast } = useToast();

  const getMensagemELink = () => {
    if (!codigo) return null;
    
    const baseUrl = window.location.origin;
    // Novo fluxo: primeiro vai para seleção de perfil, depois cadastro
    const link = `${baseUrl}/selecao-perfil?ref=${codigo}`;
    const mensagemTexto = 
      `🚀 Junte-se à MAX CAPITAL!\n\n` +
      `Olá! Estou usando a plataforma MAX CAPITAL para originação e estruturação financeira. ` +
      `Use meu código de convite e faça parte da minha rede:\n\n` +
      `📋 Código: ${codigo}\n` +
      `🔗 Link: ${link}\n\n` +
      `Cadastre-se agora e comece a acessar o mercado de capitais!`;
    
    return { link, mensagemTexto, mensagemEncoded: encodeURIComponent(mensagemTexto) };
  };

  const compartilhar = () => {
    if (!codigo) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Código de convite não encontrado.',
      });
      return;
    }

    const dados = getMensagemELink();
    if (!dados) return;

    const { mensagemEncoded } = dados;
    
    // Usar URL apropriada para cada plataforma
    const whatsappUrl = isMobileDevice()
      ? `whatsapp://send?text=${mensagemEncoded}` // Deep link para app nativo
      : `https://web.whatsapp.com/send?text=${mensagemEncoded}`; // WhatsApp Web para desktop
    
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: 'Abrindo WhatsApp...',
      description: isMobileDevice() 
        ? 'Selecione um contato para enviar o convite.'
        : 'O WhatsApp Web será aberto em uma nova aba.',
    });
  };

  // Compartilhamento nativo (Web Share API) - funciona em mobile e alguns browsers
  const compartilharNativo = async () => {
    if (!codigo) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Código de convite não encontrado.',
      });
      return;
    }

    const dados = getMensagemELink();
    if (!dados) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MAX CAPITAL - Convite',
          text: dados.mensagemTexto,
          url: dados.link,
        });
        toast({
          title: 'Sucesso!',
          description: 'Convite compartilhado com sucesso.',
        });
      } catch (error) {
        // Usuário cancelou ou erro
        if ((error as Error).name !== 'AbortError') {
          toast({
            variant: 'destructive',
            title: 'Erro',
            description: 'Não foi possível compartilhar. Tente copiar o link.',
          });
        }
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Não disponível',
        description: 'Compartilhamento nativo não suportado. Use o botão de copiar link.',
      });
    }
  };

  const suportaCompartilhamentoNativo = typeof navigator !== 'undefined' && !!navigator.share;

  const copiarLink = async () => {
    if (!codigo) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Código de convite não encontrado.',
      });
      return;
    }

    const baseUrl = window.location.origin;
    const link = `${baseUrl}/selecao-perfil?ref=${codigo}`;
    
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: 'Link copiado!',
        description: 'O link de convite foi copiado para a área de transferência.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível copiar o link.',
      });
    }
  };

  const copiarCodigo = async () => {
    if (!codigo) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Código de convite não encontrado.',
      });
      return;
    }
    
    try {
      await navigator.clipboard.writeText(codigo);
      toast({
        title: 'Código copiado!',
        description: 'O código de convite foi copiado para a área de transferência.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível copiar o código.',
      });
    }
  };

  return { 
    codigo, 
    compartilhar, 
    compartilharNativo, 
    copiarLink, 
    copiarCodigo,
    suportaCompartilhamentoNativo,
    isMobile: isMobileDevice(),
  };
}

// Hook para processar indicação após cadastro
export function useProcessarIndicacao() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ codigo_convite, novo_usuario_id }: { codigo_convite: string; novo_usuario_id: string }) => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://supabase2.maxcapital.com.br';
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE1MDUwODAwLAogICJleHAiOiAxODcyODE3MjAwCn0.dLqQQbHBeIvq-aIrBoUVGFXiL8UXV0vqfvybOOfYLsw';
      
      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${supabaseUrl}/functions/v1/process-referral`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${session?.access_token || supabaseAnonKey}`,
        },
        body: JSON.stringify({ codigo_convite, indicado_id: novo_usuario_id }),
      });

      const data = await response.json();
      console.log('Referral processing response:', { status: response.status, data });
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar indicação');
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['minhas-indicacoes'] });
    },
    onError: (error: Error) => {
      console.error('Erro ao processar indicação:', error.message);
      // Silently fail - don't show error to user during registration
    },
  });
}
