// @ts-nocheck
import { motion } from 'framer-motion';
import {
  Users, Building2, TrendingUp, Ticket,
  Shield, Zap, BarChart3, FileText,
  Lock, ScrollText, ShieldAlert, Wrench,
  GraduationCap, ArrowRight, LayoutDashboard,
  Briefcase, UserCog, ClipboardList, Fingerprint,
} from 'lucide-react';
import { Card, CardContent } from '@/shared/components/card';
import { Badge } from '@/shared/components/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { useChamados } from '@/hooks/useChamados';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } }
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const statCards = [
  { key: 'usuarios', label: 'Usuários', icon: Users, border: 'border-l-blue-500', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-500' },
  { key: 'empresas', label: 'Empresas', icon: Building2, border: 'border-l-violet-500', iconBg: 'bg-violet-500/10', iconColor: 'text-violet-500' },
  { key: 'operacoes', label: 'Operações', icon: TrendingUp, border: 'border-l-emerald-500', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-500' },
  { key: 'chamados', label: 'Chamados Abertos', icon: Ticket, border: 'border-l-amber-500', iconBg: 'bg-amber-500/10', iconColor: 'text-amber-500' },
];

// Grouped by category
const operationalLinks = [
  { label: 'Usuários', desc: 'Gerenciar contas', path: '/admin/usuarios', icon: Users, gradient: 'from-blue-500 to-blue-600' },
  { label: 'Empresas', desc: 'Cadastro de empresas', path: '/admin/empresas', icon: Building2, gradient: 'from-violet-500 to-purple-600' },
  { label: 'Operações', desc: 'Pipeline de deals', path: '/admin/operacoes', icon: TrendingUp, gradient: 'from-emerald-500 to-green-600' },
  { label: 'Investidores', desc: 'Central dos investidores', path: '/admin/investidores', icon: Briefcase, gradient: 'from-teal-500 to-cyan-600' },
];

const engagementLinks = [
  { label: 'Chamados', desc: 'Suporte e tickets', path: '/admin/chamados', icon: Ticket, gradient: 'from-amber-500 to-orange-600' },
  { label: 'Oportunidades', desc: 'Ofertas de investimento', path: '/admin/oportunidades', icon: Zap, gradient: 'from-yellow-500 to-amber-600' },
  { label: 'Teses', desc: 'Teses de investimento', path: '/admin/teses', icon: BarChart3, gradient: 'from-cyan-500 to-teal-600' },
  { label: 'Academy', desc: 'Cursos e treinamentos', path: '/admin/cursos', icon: GraduationCap, gradient: 'from-pink-500 to-rose-600' },
];

const masterLinks = [
  { label: 'Gestão de Equipe', desc: 'Membros e cargos', path: '/admin/equipe', icon: UserCog, gradient: 'from-indigo-500 to-indigo-600' },
  { label: 'Formulários', desc: 'Form builder dinâmico', path: '/admin/formularios', icon: ClipboardList, gradient: 'from-fuchsia-500 to-pink-600' },
  { label: 'Configurações', desc: 'Ajustes do sistema', path: '/admin/configuracoes', icon: Wrench, gradient: 'from-slate-500 to-slate-600' },
  
  { label: 'Auditoria & Logs', desc: 'Rastreamento de ações', path: '/admin/auditoria', icon: ScrollText, gradient: 'from-sky-500 to-cyan-600' },
  { label: 'Segurança', desc: 'Políticas e sessões', path: '/admin/seguranca', icon: ShieldAlert, gradient: 'from-rose-500 to-red-600' },
];

interface QuickLinkProps {
  link: { label: string; desc: string; path: string; icon: React.ElementType; gradient: string };
  index: number;
}

function QuickLinkCard({ link, index }: QuickLinkProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
    >
      <Link to={link.path}>
        <Card className="border-0 hover:shadow-md transition-all duration-300 cursor-pointer group h-full">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className={cn(
              'p-2.5 rounded-xl bg-gradient-to-br shadow-md shrink-0 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300',
              link.gradient
            )}>
              <link.icon className="h-4.5 w-4.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground block">{link.label}</span>
              <span className="text-[11px] text-muted-foreground">{link.desc}</span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-foreground/60 group-hover:translate-x-0.5 transition-all shrink-0" />
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, iconBg, iconColor }: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={cn('p-2.5 rounded-xl', iconBg)}>
        <Icon className={cn('h-5 w-5', iconColor)} />
      </div>
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { adminData, isMaster } = useAdminPermissions();
  const { chamados } = useChamados(true);

  const { data: stats } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const [usersResult, empresasResult, operacoesResult] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('empresas').select('*', { count: 'exact', head: true }),
        supabase.from('operacoes').select('etapa_atual'),
      ]);
      return {
        usuarios: usersResult.count || 0,
        empresas: empresasResult.count || 0,
        operacoes: (operacoesResult.data || []).length,
      };
    },
  });

  const chamadosAbertos = chamados?.filter(c => c.status === 'aberto').length || 0;

  const getStatValue = (key: string) => {
    if (key === 'chamados') return chamadosAbertos;
    return stats?.[key as keyof typeof stats] || 0;
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Painel Administrativo</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Bem-vindo, {adminData?.cargo || 'Administrador'}
          </p>
        </div>
        <Badge variant="outline" className="text-sm px-4 py-1.5 gap-1.5 border-primary/30 bg-primary/5">
          <Shield className="h-3.5 w-3.5 text-primary" />
          {adminData?.role?.toUpperCase()}
        </Badge>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
          >
            <Card className={cn('border-0 border-l-4 shadow-sm', stat.border)}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={cn('p-3 rounded-xl', stat.iconBg)}>
                  <stat.icon className={cn('h-5 w-5', stat.iconColor)} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{getStatValue(stat.key)}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Main content — two-column layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Operational */}
        <motion.div variants={item}>
          <Card className="border-0 shadow-sm h-full">
            <CardContent className="p-6">
              <SectionHeader
                icon={Briefcase}
                title="Gestão Operacional"
                subtitle="Usuários, empresas e operações"
                iconBg="bg-blue-500/10"
                iconColor="text-blue-500"
              />
              <div className="space-y-2.5">
                {operationalLinks.map((link, i) => (
                  <QuickLinkCard key={link.path} link={link} index={i} />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Engagement */}
        <motion.div variants={item}>
          <Card className="border-0 shadow-sm h-full">
            <CardContent className="p-6">
              <SectionHeader
                icon={LayoutDashboard}
                title="Engajamento & Conteúdo"
                subtitle="Chamados, oportunidades e cursos"
                iconBg="bg-amber-500/10"
                iconColor="text-amber-500"
              />
              <div className="space-y-2.5">
                {engagementLinks.map((link, i) => (
                  <QuickLinkCard key={link.path} link={link} index={i} />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Master Area */}
      {isMaster && (
        <motion.div variants={item}>
          <Card className="border-0 shadow-sm overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/[0.02] pointer-events-none" />
            <CardContent className="p-6 relative">
              <SectionHeader
                icon={Shield}
                title="Área Master"
                subtitle="Ferramentas exclusivas de administração avançada"
                iconBg="bg-primary/10"
                iconColor="text-primary"
              />
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {masterLinks.map((link, i) => (
                  <QuickLinkCard key={link.path} link={link} index={i} />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
