import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAdminLogs } from './useAdminLogs';
import { toast } from 'sonner';
import type { UserType, UserStatus, EtapaPipeline, Segmento } from '@/types/supabase';

// Hook for admin CRUD operations with logging
export function useAdminActions() {
  const queryClient = useQueryClient();
  const { logAction } = useAdminLogs();

  // Update user profile
  const updateUser = useMutation({
    mutationFn: async ({ 
      userId, 
      data 
    }: { 
      userId: string; 
      data: {
        nome?: string;
        email?: string;
        telefone?: string;
        tipo?: UserType;
        status?: UserStatus;
      };
    }) => {
      const { data: oldData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { error } = await supabase
        .from('profiles')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', userId);
      
      if (error) throw error;

      await logAction({
        acao: 'editar',
        recurso: 'usuarios',
        recurso_id: userId,
        descricao: `Usuário ${oldData?.nome} atualizado`,
        dados_anteriores: oldData,
        dados_novos: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Usuário atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar usuário'),
  });

  // Update operation
  const updateOperation = useMutation({
    mutationFn: async ({
      operacaoId,
      data,
    }: {
      operacaoId: string;
      data: {
        etapa_atual?: EtapaPipeline;
        valor_investimento?: number;
        segmento?: Segmento;
        observacoes?: string;
        responsavel_id?: string;
      };
    }) => {
      const { data: oldData } = await supabase
        .from('operacoes')
        .select('*, empresa:empresas(nome)')
        .eq('id', operacaoId)
        .single();

      const { error } = await supabase
        .from('operacoes')
        .update({ 
          ...data, 
          ultima_movimentacao: new Date().toISOString(),
          updated_at: new Date().toISOString() 
        })
        .eq('id', operacaoId);
      
      if (error) throw error;

      // Add to history if stage changed
      if (data.etapa_atual && oldData?.etapa_atual !== data.etapa_atual) {
        await supabase.from('operacoes_historico').insert({
          operacao_id: operacaoId,
          etapa_anterior: oldData?.etapa_atual,
          etapa_nova: data.etapa_atual,
          observacao: `Etapa alterada de ${oldData?.etapa_atual} para ${data.etapa_atual}`,
        });
      }

      await logAction({
        acao: 'editar',
        recurso: 'operacoes',
        recurso_id: operacaoId,
        descricao: `Operação ${oldData?.numero_funil} atualizada`,
        dados_anteriores: oldData,
        dados_novos: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-operacoes'] });
      queryClient.invalidateQueries({ queryKey: ['operacoes'] });
      toast.success('Operação atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar operação'),
  });

  // Update company
  const updateCompany = useMutation({
    mutationFn: async ({
      empresaId,
      data,
    }: {
      empresaId: string;
      data: {
        nome?: string;
        nome_fantasia?: string;
        cnpj?: string;
        segmento?: Segmento;
        contato_email?: string;
        telefone?: string;
        valor_operacao?: number;
        tipo_operacao?: string;
        logo_url?: string | null;
        status_exclusividade?: string | null;
        data_exclusividade?: string | null;
        endereco_cep?: string;
        endereco_logradouro?: string;
        endereco_numero?: string;
        endereco_complemento?: string;
        endereco_bairro?: string;
        endereco_cidade?: string;
        endereco_uf?: string;
      };
    }) => {
      const { data: oldData } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', empresaId)
        .single();

      const { error } = await supabase
        .from('empresas')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', empresaId);
      
      if (error) throw error;

      await logAction({
        acao: 'editar',
        recurso: 'empresas',
        recurso_id: empresaId,
        descricao: `Empresa ${oldData?.nome} atualizada`,
        dados_anteriores: oldData,
        dados_novos: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-empresas'] });
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      toast.success('Empresa atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar empresa'),
  });

  // Delete company
  const deleteCompany = useMutation({
    mutationFn: async (empresaId: string) => {
      const { data: oldData } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', empresaId)
        .single();

      const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', empresaId);
      
      if (error) throw error;

      await logAction({
        acao: 'deletar',
        recurso: 'empresas',
        recurso_id: empresaId,
        descricao: `Empresa ${oldData?.nome} excluída`,
        dados_anteriores: oldData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-empresas'] });
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      toast.success('Empresa excluída!');
    },
    onError: () => toast.error('Erro ao excluir empresa'),
  });

  // Delete operation
  const deleteOperation = useMutation({
    mutationFn: async (operacaoId: string) => {
      const { data: oldData } = await supabase
        .from('operacoes')
        .select('*')
        .eq('id', operacaoId)
        .single();

      const { error } = await supabase
        .from('operacoes')
        .delete()
        .eq('id', operacaoId);
      
      if (error) throw error;

      await logAction({
        acao: 'deletar',
        recurso: 'operacoes',
        recurso_id: operacaoId,
        descricao: `Operação ${oldData?.numero_funil} excluída`,
        dados_anteriores: oldData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-operacoes'] });
      queryClient.invalidateQueries({ queryKey: ['operacoes'] });
      toast.success('Operação excluída!');
    },
    onError: () => toast.error('Erro ao excluir operação'),
  });

  return {
    updateUser,
    updateOperation,
    updateCompany,
    deleteCompany,
    deleteOperation,
  };
}
