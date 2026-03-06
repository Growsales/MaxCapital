import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ProfileDetails } from '@/components/profile/PersonalInfoTab';

export function useProfileDetails(userId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['profileDetails', userId],
    queryFn: async (): Promise<ProfileDetails | null> => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('profile_details')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile details:', error);
        return null;
      }
      
      return data as ProfileDetails | null;
    },
    enabled: !!userId,
  });

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['profileDetails', userId] });
    queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    queryClient.invalidateQueries({ queryKey: ['currentProfile'] });
  };

  return {
    ...query,
    refetch,
  };
}
