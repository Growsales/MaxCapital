import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface ProfileCompletionStatus {
  isComplete: boolean;
  isLoading: boolean;
  missingFields: string[];
}

export function useProfileComplete(userId?: string): ProfileCompletionStatus {
  const { data, isLoading } = useQuery({
    queryKey: ['profileComplete', userId],
    queryFn: async () => {
      if (!userId) return { isComplete: false, missingFields: [] };

      // Fetch profile and profile_details
      const [profileResult, detailsResult] = await Promise.all([
        supabase.from('profiles').select('nome, telefone').eq('id', userId).maybeSingle(),
        supabase.from('profile_details').select('cpf, data_nascimento, endereco_cep, endereco_logradouro, endereco_numero, endereco_bairro, endereco_cidade, endereco_uf').eq('user_id', userId).maybeSingle(),
      ]);

      const profile = profileResult.data;
      const details = detailsResult.data;

      const missingFields: string[] = [];

      // Check required fields from profiles table
      if (!profile?.nome?.trim() || profile.nome.trim().split(' ').length < 2) {
        missingFields.push('nome');
      }
      if (!profile?.telefone?.trim()) {
        missingFields.push('telefone');
      }

      // Check required fields from profile_details table
      if (!details) {
        missingFields.push('cpf', 'data_nascimento', 'endereco_cep', 'endereco_logradouro', 'endereco_numero', 'endereco_bairro', 'endereco_cidade', 'endereco_uf');
      } else {
        if (!details.cpf?.trim()) missingFields.push('cpf');
        if (!details.data_nascimento) missingFields.push('data_nascimento');
        if (!details.endereco_cep?.trim()) missingFields.push('endereco_cep');
        if (!details.endereco_logradouro?.trim()) missingFields.push('endereco_logradouro');
        if (!details.endereco_numero?.trim()) missingFields.push('endereco_numero');
        if (!details.endereco_bairro?.trim()) missingFields.push('endereco_bairro');
        if (!details.endereco_cidade?.trim()) missingFields.push('endereco_cidade');
        if (!details.endereco_uf?.trim()) missingFields.push('endereco_uf');
      }

      return {
        isComplete: missingFields.length === 0,
        missingFields,
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    isComplete: data?.isComplete ?? false,
    isLoading,
    missingFields: data?.missingFields ?? [],
  };
}
