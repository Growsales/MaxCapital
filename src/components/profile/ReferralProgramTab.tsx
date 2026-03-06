import type { Tables } from '@/types/supabase';
import type { ProfileDetails } from './PersonalInfoTab';
import ReferralCard from '@/features/network/components/ReferralCard';

interface ReferralProgramTabProps {
  profile: Tables<'profiles'> | null;
  profileDetails: ProfileDetails | null;
}

export default function ReferralProgramTab({ profile, profileDetails }: ReferralProgramTabProps) {
  return <ReferralCard />;
}
