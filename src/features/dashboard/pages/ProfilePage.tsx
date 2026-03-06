import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  User, 
  Briefcase, 
  Shield, 
  CreditCard, 
  Users, 
  Bell,
  DollarSign,
  Loader2
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/tabs';
import { useAuth } from '@/shared/hooks/useAuth';
import { useProfileDetails } from '@/hooks/useProfileDetails';
import ProfileHeader from '@/components/profile/ProfileHeader';
import PersonalInfoTab from '@/components/profile/PersonalInfoTab';
import ProfessionalInfoTab from '@/components/profile/ProfessionalInfoTab';
import SecurityTab from '@/components/profile/SecurityTab';
import BankingInfoTab from '@/components/profile/BankingInfoTab';
import ReferralProgramTab from '@/components/profile/ReferralProgramTab';
import NotificationsTab from '@/components/profile/NotificationsTab';
import RemuneracoesTab from '@/components/profile/RemuneracoesTab';

export default function ProfilePage() {
  const { profile, user, isLoading } = useAuth();
  const { data: profileDetails, refetch: refetchDetails } = useProfileDetails(profile?.id);
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'pessoais');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const isParceiro = profile?.tipo === 'parceiro';
  const isInvestidor = profile?.tipo === 'investidor';
  const isEmpresa = profile?.tipo === 'empresa';

  const handleAvatarUpdate = (url: string) => {
    // The profile will be refetched automatically by the auth context
    refetchDetails();
  };

  const handleUpdate = () => {
    refetchDetails();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Profile Header with Avatar Upload */}
      <ProfileHeader 
        profile={profile} 
        user={user} 
        onAvatarUpdate={handleAvatarUpdate}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-2 h-auto p-0 overflow-x-auto flex-nowrap">
          <TabsTrigger 
            value="pessoais" 
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 flex items-center gap-2 whitespace-nowrap"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Informações Pessoais</span>
            <span className="sm:hidden">Pessoais</span>
          </TabsTrigger>
          <TabsTrigger 
            value="profissionais" 
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 flex items-center gap-2 whitespace-nowrap"
          >
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Profissionais</span>
            <span className="sm:hidden">Prof.</span>
          </TabsTrigger>
          <TabsTrigger 
            value="seguranca" 
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 flex items-center gap-2 whitespace-nowrap"
          >
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Segurança</span>
            <span className="sm:hidden">Seg.</span>
          </TabsTrigger>
          {!isInvestidor && !isEmpresa && (
            <TabsTrigger 
              value="bancarios" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 flex items-center gap-2 whitespace-nowrap"
            >
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Dados Bancários</span>
              <span className="sm:hidden">Banco</span>
            </TabsTrigger>
          )}
          {/* Hide Indicações tab for empresa and investidor users */}
          {isParceiro && (
            <TabsTrigger 
              value="indicacoes" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 flex items-center gap-2 whitespace-nowrap"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Indicações</span>
              <span className="sm:hidden">Indic.</span>
            </TabsTrigger>
          )}
          {isParceiro && (
            <TabsTrigger 
              value="remuneracoes" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 flex items-center gap-2 whitespace-nowrap"
            >
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Minhas Remunerações</span>
              <span className="sm:hidden">Remun.</span>
            </TabsTrigger>
          )}
          <TabsTrigger 
            value="notificacoes" 
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 flex items-center gap-2 whitespace-nowrap"
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notificações</span>
            <span className="sm:hidden">Notif.</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pessoais" className="mt-6">
          <PersonalInfoTab 
            profile={profile} 
            user={user} 
            profileDetails={profileDetails || null}
            onUpdate={handleUpdate}
          />
        </TabsContent>

        <TabsContent value="profissionais" className="mt-6">
          <ProfessionalInfoTab 
            profile={profile} 
            profileDetails={profileDetails || null}
            onUpdate={handleUpdate}
          />
        </TabsContent>

        <TabsContent value="seguranca" className="mt-6">
          <SecurityTab />
        </TabsContent>

        {!isInvestidor && (
          <TabsContent value="bancarios" className="mt-6">
            <BankingInfoTab 
              profile={profile} 
              profileDetails={profileDetails || null}
              onUpdate={handleUpdate}
            />
          </TabsContent>
        )}

        {/* Only render Indicações content for parceiro users */}
        {isParceiro && (
          <TabsContent value="indicacoes" className="mt-6">
            <ReferralProgramTab 
              profile={profile} 
              profileDetails={profileDetails || null}
            />
          </TabsContent>
        )}

        {isParceiro && (
          <TabsContent value="remuneracoes" className="mt-6">
            <RemuneracoesTab />
          </TabsContent>
        )}

        <TabsContent value="notificacoes" className="mt-6">
          <NotificationsTab 
            profile={profile} 
            profileDetails={profileDetails || null}
            onUpdate={handleUpdate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
