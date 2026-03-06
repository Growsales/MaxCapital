import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { useAdminPermissions } from './useAdminPermissions';

export type AcaoAdmin = 'criar' | 'editar' | 'deletar' | 'aprovar' | 'rejeitar' | 'ativar' | 'desativar' | 'login' | 'export';

export interface AdminLog {
  id: string;
  admin_id: string;
  acao: AcaoAdmin;
  recurso: string;
  recurso_id: string | null;
  descricao: string | null;
  dados_anteriores: Record<string, unknown> | null;
  dados_novos: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  // Joined
  admin?: {
    id: string;
    cargo: string | null;
    profile?: {
      nome: string;
      avatar_url: string | null;
    };
  };
}

interface CreateLogData {
  acao: AcaoAdmin;
  recurso: string;
  recurso_id?: string;
  descricao?: string;
  dados_anteriores?: Record<string, unknown>;
  dados_novos?: Record<string, unknown>;
}

export function useAdminLogs() {
  const { adminData } = useAdminPermissions();
  const queryClient = useQueryClient();

  // Fetch logs with pagination
  const useLogs = (page = 1, limit = 50, filters?: {
    recurso?: string;
    acao?: AcaoAdmin;
    admin_id?: string;
  }) => {
    return useQuery({
      queryKey: ['admin-logs', page, limit, filters],
      queryFn: async () => {
        let query = supabase
          .from('admin_logs')
          .select(`
            *,
            admin:admin_equipe!admin_logs_admin_id_fkey(
              id,
              cargo,
              profile:profiles!admin_equipe_user_id_fkey(nome, avatar_url)
            )
          `, { count: 'exact' })
          .order('created_at', { ascending: false })
          .range((page - 1) * limit, page * limit - 1);

        if (filters?.recurso) {
          query = query.eq('recurso', filters.recurso);
        }
        if (filters?.acao) {
          query = query.eq('acao', filters.acao);
        }
        if (filters?.admin_id) {
          query = query.eq('admin_id', filters.admin_id);
        }

        const { data, error, count } = await query;

        if (error) {
          console.error('Error fetching logs:', error);
          return { logs: [], total: 0 };
        }

        return { 
          logs: data as AdminLog[], 
          total: count || 0 
        };
      },
    });
  };

  // Create log entry
  const createLog = useMutation({
    mutationFn: async (data: CreateLogData) => {
      if (!adminData?.id) throw new Error('Admin não autenticado');

      const { error } = await supabase
        .from('admin_logs')
        .insert({
          admin_id: adminData.id,
          acao: data.acao,
          recurso: data.recurso,
          recurso_id: data.recurso_id,
          descricao: data.descricao,
          dados_anteriores: data.dados_anteriores,
          dados_novos: data.dados_novos,
          user_agent: navigator.userAgent,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
    },
  });

  // Helper to log actions
  const logAction = async (data: CreateLogData) => {
    if (!adminData?.id) return;
    try {
      await createLog.mutateAsync(data);
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  return {
    useLogs,
    createLog,
    logAction,
  };
}
