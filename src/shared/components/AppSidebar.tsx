import { Link, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { 
  Home, 
  BarChart3, 
  Building2, 
  Plus, 
  TrendingUp, 
  Users, 
  Lightbulb, 
  GraduationCap,
  Briefcase,
  Package, 
  BookOpen, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/shared/hooks/useAuth';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { filterNavItems, canCreateOperation } from '@/lib/permissions';
import type { UserType } from '@/types/supabase';

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onNewDeal: () => void;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  isAction?: boolean;
  id?: string;
}

const mainNavItems: NavItem[] = [
  { icon: Home, label: 'Home', path: '/dashboard' },
  { icon: BarChart3, label: 'Relatórios', path: '/relatorios' },
  { icon: Building2, label: 'Empresas', path: '/empresas' },
];

const businessNavItems: NavItem[] = [
  { icon: Plus, label: 'Novo negócio', path: '#novo', isAction: true, id: 'new-deal' },
  { icon: TrendingUp, label: 'Minhas operações', path: '/operacoes' },
  { icon: Briefcase, label: 'Oportunidades', path: '/oportunidades' },
  { icon: Users, label: 'Minha rede', path: '/rede' },
  { icon: Lightbulb, label: 'Teses', path: '/teses' },
];

const academyNavItems: NavItem[] = [
  { icon: GraduationCap, label: 'Treinamentos', path: '/treinamentos' },
  { icon: Package, label: 'Kit comercial', path: '/materiais' },
  { icon: BookOpen, label: 'Guias e manuais', path: '/guias' },
];

export function AppSidebar({ collapsed, onToggle, onNewDeal }: AppSidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  const { profile } = useAuth();
  const { isAdmin } = useAdminPermissions();
  
  const userType = profile?.tipo as UserType | undefined;
  const isInvestidor = userType === 'investidor';
  const showNewDealAction = canCreateOperation(userType) || isInvestidor;

  // Admin vê tudo no menu; demais perfis seguem matriz de rotas
  const filteredMainNav = useMemo(
    () => (isAdmin ? mainNavItems : filterNavItems(mainNavItems, userType)),
    [isAdmin, userType]
  );

  const filteredBusinessNav = useMemo(() => {
    const baseItems = isAdmin ? businessNavItems : filterNavItems(businessNavItems, userType);
    // Remover ação "Novo negócio" se o usuário não pode criar operações
    if (!showNewDealAction) {
      return baseItems.filter((item) => !item.isAction);
    }
    return baseItems;
  }, [isAdmin, userType, showNewDealAction]);

  const filteredAcademyNav = useMemo(
    () => (isAdmin ? academyNavItems : filterNavItems(academyNavItems, userType)),
    [isAdmin, userType]
  );

  const NavItem = ({ icon: Icon, label, path, isAction, id }: { 
    icon: React.ElementType; 
    label: string; 
    path: string;
    isAction?: boolean;
    id?: string;
  }) => {
    const isActive = currentPath === path;
    const displayLabel = id === 'new-deal' && isInvestidor ? 'Nova tese' : label;
    
    if (isAction) {
      return (
        <button
          onClick={onNewDeal}
          className={cn(
            'nav-item w-full',
            collapsed && 'justify-center px-2'
          )}
        >
          <Icon className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>{displayLabel}</span>}
        </button>
      );
    }

    return (
      <Link
        to={path}
        className={cn(
          'nav-item',
          isActive && 'active',
          collapsed && 'justify-center px-2'
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {!collapsed && <span>{label}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border',
        'flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        {!collapsed && (
          <Link to="/dashboard" className="logo-text flex items-center gap-1">
            <span className="font-bold text-white">MAX</span>
            <span className="w-px h-5 bg-primary mx-1" />
            <span className="font-medium text-white/80">CAPITAL</span>
          </Link>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground hover:text-white transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {/* Main Section */}
        {filteredMainNav.length > 0 && (
          <div className="space-y-1">
            {filteredMainNav.map((item) => (
              <NavItem key={item.path} {...item} />
            ))}
          </div>
        )}

        {/* Business Section */}
        {filteredBusinessNav.length > 0 && (
          <div className="mt-6">
            {!collapsed && (
              <div className="nav-section-title">Área de Negócios</div>
            )}
            <div className="space-y-1 mt-2">
              {filteredBusinessNav.map((item) => (
                <NavItem key={item.path} {...item} />
              ))}
            </div>
          </div>
        )}

        {/* Academy Section */}
        {filteredAcademyNav.length > 0 && (
          <div className="mt-6">
            {!collapsed && (
              <div className="nav-section-title">Academy</div>
            )}
            <div className="space-y-1 mt-2">
              {filteredAcademyNav.map((item) => (
                <NavItem key={item.path} {...item} />
              ))}
            </div>
          </div>
        )}
        {/* Admin Section */}
        {isAdmin && (
          <div className="mt-6">
            {!collapsed && (
              <div className="nav-section-title">Administração</div>
            )}
            <div className="space-y-1 mt-2">
              <Link
                to="/admin"
                className={cn(
                  'nav-item',
                  currentPath.startsWith('/admin') && 'active',
                  collapsed && 'justify-center px-2'
                )}
              >
                <Shield className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>Painel Admin</span>}
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        {showNewDealAction && (
          <Button
            onClick={onNewDeal}
            className={cn(
              'w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium',
              collapsed ? 'px-2' : 'px-4'
            )}
          >
            {collapsed ? <Plus className="h-5 w-5" /> : isInvestidor ? 'Nova Tese' : 'Novo Negócio'}
          </Button>
        )}
        
        <Link
          to="/login"
          className={cn(
            'nav-item',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </Link>
      </div>
    </aside>
  );
}
