import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { AdminRole } from './useAdminPermissions';

export interface AdminMember {
  id: string;
  user_id: string;
  role: AdminRole;
  departamento: string | null;
  cargo: string | null;
  permissoes_custom: Record<string, unknown> | null;
  ativo: boolean;
  data_admissao: string;
  adicionado_por: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  profile?: {
    id: string;
    nome: string;
    email: string;
    telefone: string | null;
    avatar_url: string | null;
  };
  adicionado_por_profile?: {
    nome: string;
  };
}

interface AddAdminData {
  user_id: string;
  role: AdminRole;
  departamento?: string;
  cargo?: string;
}

interface UpdateAdminData {
  id: string;
  role?: AdminRole;
  departamento?: string;
  cargo?: string;
  ativo?: boolean;
}

export function useAdminEquipe() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all admin team members
  const { data: equipe, isLoading } = useQuery({
    queryKey: ['admin-equipe-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_equipe')
        .select(`
          *,
          profile:profiles!admin_equipe_user_id_fkey(id, nome, email, telefone, avatar_url),
          adicionado_por_profile:profiles!admin_equipe_adicionado_por_fkey(nome)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching admin equipe:', error);
        return [];
      }

      return data as AdminMember[];
    },
  });

  // Search user by name or email for adding to team
  const searchUsers = async (query: string) => {
    const searchQuery = query.trim();
    
    let queryBuilder = supabase
      .from('profiles')
      .select('id, nome, email, avatar_url, tipo, telefone, created_at')
      .order('nome');

    if (searchQuery) {
      queryBuilder = queryBuilder.or(`nome.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    }

    const { data, error } = await queryBuilder.limit(20);

    if (error) {
      console.error('Error searching users:', error);
      return [];
    }

    // Filter out users already in admin team
    const adminUserIds = equipe?.map(e => e.user_id) || [];
    return data.filter(u => !adminUserIds.includes(u.id));
  };

  // Fetch initial users (non-admins) for display
  const { data: availableUsers, isLoading: isLoadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['available-users-for-admin', equipe?.map(e => e.user_id)],
    queryFn: async () => {
      const adminUserIds = equipe?.map(e => e.user_id) || [];
      
      let query = supabase
        .from('profiles')
        .select('id, nome, email, avatar_url, tipo, telefone, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (adminUserIds.length > 0) {
        query = query.not('id', 'in', `(${adminUserIds.join(',')})`);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching available users:', error);
        return [];
      }
      return data;
    },
    enabled: !!equipe,
  });

  // Add new admin member
  const addAdmin = useMutation({
    mutationFn: async (data: AddAdminData) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data: newAdmin, error } = await supabase
        .from('admin_equipe')
        .insert({
          user_id: data.user_id,
          role: data.role,
          departamento: data.departamento,
          cargo: data.cargo,
          adicionado_por: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return newAdmin;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-equipe-list'] });
      toast.success('Administrador adicionado com sucesso!');
    },
    onError: (error) => {
      console.error('Error adding admin:', error);
      toast.error('Erro ao adicionar administrador');
    },
  });

  // Update admin member
  const updateAdmin = useMutation({
    mutationFn: async ({ id, ...data }: UpdateAdminData) => {
      const { data: updated, error } = await supabase
        .from('admin_equipe')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-equipe-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-equipe'] });
      toast.success('Administrador atualizado!');
    },
    onError: (error) => {
      console.error('Error updating admin:', error);
      toast.error('Erro ao atualizar administrador');
    },
  });

  // Remove admin (deactivate)
  const removeAdmin = useMutation({
    mutationFn: async (adminId: string) => {
      const { error } = await supabase
        .from('admin_equipe')
        .update({ ativo: false, updated_at: new Date().toISOString() })
        .eq('id', adminId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-equipe-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-equipe'] });
      toast.success('Administrador removido da equipe');
    },
    onError: (error) => {
      console.error('Error removing admin:', error);
      toast.error('Erro ao remover administrador');
    },
  });

  // Reactivate admin
  const reactivateAdmin = useMutation({
    mutationFn: async (adminId: string) => {
      const { error } = await supabase
        .from('admin_equipe')
        .update({ ativo: true, updated_at: new Date().toISOString() })
        .eq('id', adminId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-equipe-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-equipe'] });
      toast.success('Administrador reativado!');
    },
    onError: (error) => {
      console.error('Error reactivating admin:', error);
      toast.error('Erro ao reativar administrador');
    },
  });

  // Get stats
  const stats = {
    total: equipe?.length || 0,
    ativos: equipe?.filter(e => e.ativo).length || 0,
    masters: equipe?.filter(e => e.role === 'master' && e.ativo).length || 0,
    administradores: equipe?.filter(e => e.role === 'administrador' && e.ativo).length || 0,
    suporte: equipe?.filter(e => e.role === 'suporte' && e.ativo).length || 0,
  };

  return {
    equipe,
    isLoading,
    stats,
    searchUsers,
    availableUsers,
    isLoadingUsers,
    refetchUsers,
    addAdmin,
    updateAdmin,
    removeAdmin,
    reactivateAdmin,
  };
}
