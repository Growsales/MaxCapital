import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { SupportButton } from '@/components/support/SupportButton';
import { useAuth } from '@/shared/hooks/useAuth';
import { NewDealModalWizard } from '@/features/operations/components/NewDealWizard/NewDealModalWizard';

const routeTitles: Record<string, string> = {
  '/dashboard': '',
  '/relatorios': 'Relatórios',
  '/empresas': 'Empresas',
  '/operacoes': 'Operações',
  '/rede': 'Rede',
  '/oportunidades': 'Oportunidades',
  '/teses': 'Teses de Investimento',
  '/perfil': 'Meu Perfil',
  '/treinamentos': 'Treinamentos',
  '/materiais': 'Materiais',
  '/guias': 'Guias',
  '/admin': 'Painel Admin',
  '/admin/usuarios': 'Usuários',
  '/admin/equipe': 'Equipe',
  '/admin/operacoes': 'Operações',
  '/admin/empresas': 'Empresas',
  '/admin/chamados': 'Chamados',
  '/admin/teses': 'Teses',
  '/admin/oportunidades': 'Oportunidades',
  '/admin/cursos': 'Academy',
  '/admin/comissoes': 'Comissões',
  '/admin/configuracoes': 'Configurações',
  '/admin/logs': 'Auditoria',
  '/admin/formularios': 'Formulários',
  '/admin/auditoria': 'Auditoria',
  '/admin/seguranca': 'Segurança',
};

function getPageTitle(pathname: string): string {
  if (routeTitles[pathname]) return routeTitles[pathname];
  if (pathname.startsWith('/operacoes/')) return 'Detalhes da Operação';
  if (pathname.startsWith('/oportunidades/')) return 'Detalhes da Oportunidade';
  if (pathname.startsWith('/teses/')) return 'Detalhes da Tese';
  return 'Dashboard';
}

interface DashboardLayoutProps {
  title?: string;
  showBackButton?: boolean;
}

export function DashboardLayout({ title, showBackButton }: DashboardLayoutProps) {
  const location = useLocation();
  const pageTitle = title || getPageTitle(location.pathname);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [newDealOpen, setNewDealOpen] = useState(false);
  const { profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onNewDeal={() => setNewDealOpen(true)}
      />
      
      <AppHeader 
        title={pageTitle} 
        showBackButton={showBackButton}
        sidebarCollapsed={sidebarCollapsed}
      />

      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'pl-16' : 'pl-56'
        )}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>

      <SupportButton />
      <NewDealModalWizard open={newDealOpen} onOpenChange={setNewDealOpen} />
    </div>
  );
}
