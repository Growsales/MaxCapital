import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/supabase';

type Curso = Tables<'cursos'>;
type ProgressoCurso = Tables<'progresso_cursos'>;

interface CursoComProgresso extends Curso {
  progresso: number;
  status: 'não iniciado' | 'em andamento' | 'concluído';
}

export function useCursos() {
  return useQuery({
    queryKey: ['cursos'],
    queryFn: async (): Promise<Curso[]> => {
      const { data, error } = await supabase
        .from('cursos')
        .select('*')
        .order('ordem', { ascending: true });
      if (error) throw error;
      return (data || []) as Curso[];
    },
  });
}

export function useProgressoCursos() {
  return useQuery({
    queryKey: ['progresso-cursos'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('progresso_cursos')
        .select(`
          *,
          curso:cursos(*)
        `)
        .eq('usuario_id', user.id);
      
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCursosComProgresso() {
  return useQuery({
    queryKey: ['cursos-com-progresso'],
    queryFn: async (): Promise<CursoComProgresso[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: cursos, error: cursosError } = await supabase
        .from('cursos')
        .select('*')
        .order('ordem', { ascending: true });
      
      if (cursosError) throw cursosError;
      
      const cursosData = (cursos || []) as Curso[];
      
      if (!user) {
        return cursosData.map(curso => ({
          ...curso,
          progresso: 0,
          status: 'não iniciado' as const,
        }));
      }
      
      const { data: progressos, error: progressoError } = await supabase
        .from('progresso_cursos')
        .select('*')
        .eq('usuario_id', user.id);
      
      if (progressoError) throw progressoError;
      
      const progressosData = (progressos || []) as ProgressoCurso[];
      
      return cursosData.map(curso => {
        const progresso = progressosData.find(p => p.curso_id === curso.id);
        return {
          ...curso,
          progresso: progresso?.progresso || 0,
          status: progresso?.status || 'não iniciado',
        };
      });
    },
  });
}

export function useUpdateProgresso() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      cursoId, 
      progresso 
    }: { 
      cursoId: string; 
      progresso: number;
    }): Promise<ProgressoCurso> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      const status = progresso >= 100 ? 'concluído' : progresso > 0 ? 'em andamento' : 'não iniciado';
      
      const { data, error } = await supabase
        .from('progresso_cursos')
        .upsert({
          usuario_id: user.id,
          curso_id: cursoId,
          progresso,
          status,
          concluido_em: status === 'concluído' ? new Date().toISOString() : null,
        } as any, {
          onConflict: 'usuario_id,curso_id',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as ProgressoCurso;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progresso-cursos'] });
      queryClient.invalidateQueries({ queryKey: ['cursos-com-progresso'] });
    },
  });
}
