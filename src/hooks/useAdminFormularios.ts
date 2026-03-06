import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface FormularioPergunta {
  id: string;
  setor: string;
  segmento: string;
  pergunta: string;
  tipo_campo: 'text' | 'number' | 'select' | 'multiselect' | 'textarea' | 'checkbox' | 'date' | 'currency';
  opcoes: string[] | null;
  obrigatorio: boolean;
  ordem: number;
  placeholder: string | null;
  tooltip: string | null;
  ativo: boolean;
  grupo: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePerguntaData {
  setor: string;
  segmento: string;
  pergunta: string;
  tipo_campo: FormularioPergunta['tipo_campo'];
  opcoes?: string[];
  obrigatorio?: boolean;
  ordem?: number;
  placeholder?: string;
  tooltip?: string;
  ativo?: boolean;
  grupo?: string;
}

export function useAdminFormularios() {
  const queryClient = useQueryClient();

  // Fetch all questions
  const { data: perguntas, isLoading } = useQuery({
    queryKey: ['admin-formularios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formularios_perguntas')
        .select('*')
        .order('setor', { ascending: true })
        .order('segmento', { ascending: true })
        .order('ordem', { ascending: true });

      if (error) throw error;
      return data as FormularioPergunta[];
    },
  });

  // Fetch questions by sector and segment
  const fetchPerguntasBySetorSegmento = async (setor: string, segmento?: string) => {
    let query = supabase
      .from('formularios_perguntas')
      .select('*')
      .eq('setor', setor)
      .eq('ativo', true)
      .order('ordem', { ascending: true });

    if (segmento) {
      query = query.eq('segmento', segmento);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as FormularioPergunta[];
  };

  // Create question
  const createPergunta = useMutation({
    mutationFn: async (data: CreatePerguntaData) => {
      const { error } = await supabase
        .from('formularios_perguntas')
        .insert({
          ...data,
          opcoes: data.opcoes || null,
          obrigatorio: data.obrigatorio ?? false,
          ativo: data.ativo ?? true,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-formularios'] });
      toast.success('Pergunta criada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating pergunta:', error);
      toast.error('Erro ao criar pergunta');
    },
  });

  // Update question
  const updatePergunta = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreatePerguntaData> }) => {
      const { error } = await supabase
        .from('formularios_perguntas')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-formularios'] });
      toast.success('Pergunta atualizada!');
    },
    onError: () => {
      toast.error('Erro ao atualizar pergunta');
    },
  });

  // Delete question
  const deletePergunta = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('formularios_perguntas')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-formularios'] });
      toast.success('Pergunta excluída!');
    },
    onError: () => {
      toast.error('Erro ao excluir pergunta');
    },
  });

  // Reorder questions
  const reorderPerguntas = useMutation({
    mutationFn: async (updates: { id: string; ordem: number }[]) => {
      const promises = updates.map(({ id, ordem }) =>
        supabase
          .from('formularios_perguntas')
          .update({ ordem, updated_at: new Date().toISOString() })
          .eq('id', id)
      );
      const results = await Promise.all(promises);
      const error = results.find(r => r.error)?.error;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-formularios'] });
      toast.success('Ordem atualizada!');
    },
    onError: () => {
      toast.error('Erro ao reordenar perguntas');
    },
  });

  // Toggle active status
  const toggleAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('formularios_perguntas')
        .update({ ativo, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-formularios'] });
      toast.success('Status atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar status');
    },
  });

  // Duplicate question
  const duplicatePergunta = useMutation({
    mutationFn: async (pergunta: FormularioPergunta) => {
      const { id, created_at, updated_at, ...rest } = pergunta;
      const { error } = await supabase
        .from('formularios_perguntas')
        .insert({
          ...rest,
          pergunta: `${rest.pergunta} (cópia)`,
          ordem: rest.ordem + 1,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-formularios'] });
      toast.success('Pergunta duplicada!');
    },
    onError: () => {
      toast.error('Erro ao duplicar pergunta');
    },
  });

  return {
    perguntas,
    isLoading,
    fetchPerguntasBySetorSegmento,
    createPergunta,
    updatePergunta,
    deletePergunta,
    reorderPerguntas,
    toggleAtivo,
    duplicatePergunta,
  };
}
