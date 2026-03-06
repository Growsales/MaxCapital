import { useState, useEffect } from 'react';
import { Bell, User, ChevronLeft, Moon, Sun, LogOut, MessageCircleOff, MessageCircle, Users, Building2, TrendingUp, Briefcase, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/shared/hooks/useAuth';
import { useProfileDetails } from '@/hooks/useProfileDetails';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { supabase } from '@/lib/supabase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AppHeaderProps {
  title: string;
  showBackButton?: boolean;
  sidebarCollapsed: boolean;
}

export function AppHeader({ title, showBackButton, sidebarCollapsed }: AppHeaderProps) {
  const navigate = useNavigate();
  const { profile, user, signOut, switchProfileType } = useAuth();
  const { canSwitchProfiles } = useAdminPermissions();
  const { data: profileDetails } = useProfileDetails(user?.id);
  const [notificationCount] = useState(3);
  const [isDark, setIsDark] = useState(true);
  const [supportButtonHidden, setSupportButtonHidden] = useState(() => {
    return localStorage.getItem('hideSupportButton') === 'true';
  });

  // Load theme from profile or localStorage
  useEffect(() => {
    if (profileDetails?.tema_preferido) {
      const isDarkFromProfile = profileDetails.tema_preferido === 'dark';
      setIsDark(isDarkFromProfile);
      document.documentElement.classList.toggle('dark', isDarkFromProfile);
      localStorage.setItem('theme', profileDetails.tema_preferido);
    } else {
      const stored = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialDark = stored ? stored === 'dark' : prefersDark;
      setIsDark(initialDark);
      document.documentElement.classList.toggle('dark', initialDark);
    }
  }, [profileDetails?.tema_preferido]);

  const toggleTheme = async () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle('dark', newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');

    // Save to database if user is logged in
    if (user?.id) {
      await supabase
        .from('profile_details')
        .upsert({
          user_id: user.id,
          tema_preferido: newDark ? 'dark' : 'light',
        }, {
          onConflict: 'user_id',
        });
    }
  };

  const toggleSupportButton = () => {
    const newValue = !supportButtonHidden;
    setSupportButtonHidden(newValue);
    localStorage.setItem('hideSupportButton', String(newValue));
    // Dispatch custom event to notify SupportButton
    window.dispatchEvent(new CustomEvent('supportButtonVisibilityChange', { detail: { hidden: newValue } }));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const displayName = profile?.nome || user?.email?.split('@')[0] || 'Usuário';
  const displayEmail = profile?.email || user?.email || '';

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16 bg-background border-b border-border',
        'flex items-center justify-between px-6 transition-all duration-300',
        sidebarCollapsed ? 'left-16' : 'left-56'
      )}
    >
      {/* Left - Title */}
      <div className="flex items-center gap-3">
        {showBackButton && (
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </h1>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                  {notificationCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 border-0">
            <DropdownMenuLabel>Notificações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium text-sm">Nova operação movimentada</span>
              <span className="text-xs text-muted-foreground">Eskala avançou para Comitê</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium text-sm">Exclusividade vencendo</span>
              <span className="text-xs text-muted-foreground">Tech Solutions em 3 dias</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium text-sm">Novo parceiro na rede</span>
              <span className="text-xs text-muted-foreground">Carlos Mendes foi adicionado</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center text-primary text-sm cursor-pointer" onClick={() => navigate('/perfil?tab=notificacoes')}>
              Ver todas as notificações
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 p-1 rounded-full bg-primary text-primary-foreground h-9 w-9 justify-center hover:bg-primary/90 transition-colors">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className="h-full w-full rounded-full object-cover" />
              ) : (
                <span className="text-sm font-medium">{getInitials(displayName)}</span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-0">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{displayName}</span>
                <span className="text-xs text-muted-foreground">{displayEmail}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/perfil" className="cursor-pointer">
                <User className="h-4 w-4 mr-2" />
                Meu Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleSupportButton} className="cursor-pointer">
              {supportButtonHidden ? (
                <>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Mostrar Suporte
                </>
              ) : (
                <>
                  <MessageCircleOff className="h-4 w-4 mr-2" />
                  Ocultar Suporte
                </>
              )}
            </DropdownMenuItem>
            {canSwitchProfiles && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Trocar visão (Admin)</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => switchProfileType('admin')} className={cn("cursor-pointer", profile?.tipo === 'admin' && "bg-red-500/10 text-red-500")}>
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => switchProfileType('parceiro')} className={cn("cursor-pointer", profile?.tipo === 'parceiro' && "bg-primary/10 text-primary")}>
                  <Briefcase className="h-4 w-4 mr-2" />
                  Parceiro
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => switchProfileType('empresa')} className={cn("cursor-pointer", profile?.tipo === 'empresa' && "bg-primary/10 text-primary")}>
                  <Building2 className="h-4 w-4 mr-2" />
                  Empresa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => switchProfileType('investidor')} className={cn("cursor-pointer", profile?.tipo === 'investidor' && "bg-primary/10 text-primary")}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Investidor
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
