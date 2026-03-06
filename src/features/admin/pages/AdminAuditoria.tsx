import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScrollText, Search, Download, ShieldAlert,
  AlertTriangle, LogIn, Activity, Eye, Lock,
  ChevronDown, ChevronRight, RefreshCw, Clock,
  CheckCircle2, XCircle, MoreHorizontal, Copy,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/card';
import { Badge } from '@/shared/components/badge';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/select';
import { Skeleton } from '@/shared/components/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/components/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/tooltip';
import { cn } from '@/lib/utils';
import { AdminBreadcrumb } from '@/features/admin/components/AdminBreadcrumb';
import { AdminPagination } from '@/features/admin/components/AdminPagination';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { useAdminLogs, type AcaoAdmin } from '@/hooks/useAdminLogs';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SecurityEventRow {
  id: string;
  event_type: string;
  user_id?: string;
  user_email?: string;
  ip_address?: string;
  user_agent?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metadata?: Record<string, unknown>;
  resolved?: boolean;
  resolution_notes?: string;
  created_at: string;
}

interface PermissionAuditRow {
  id: string;
  user_id: string;
  permission: string;
  allowed: boolean;
  context?: Record<string, unknown>;
  timestamp: string;
  resource_type?: string;
  resource_id?: string;
  created_at: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const severityConfig: Record<string, { label: string; dotColor: string; bgColor: string; textColor: string }> = {
  low: { label: 'Baixa', dotColor: 'bg-muted-foreground', bgColor: 'bg-muted/50', textColor: 'text-muted-foreground' },
  medium: { label: 'Média', dotColor: 'bg-yellow-500', bgColor: 'bg-yellow-500/10', textColor: 'text-yellow-500' },
  high: { label: 'Alta', dotColor: 'bg-orange-500', bgColor: 'bg-orange-500/10', textColor: 'text-orange-500' },
  critical: { label: 'Crítica', dotColor: 'bg-destructive', bgColor: 'bg-destructive/10', textColor: 'text-destructive' },
};

const eventTypeLabels: Record<string, string> = {
  LOGIN: 'Login', LOGOUT: 'Logout', LOGIN_FAILED: 'Login Falhou',
  PERMISSION_DENIED: 'Permissão Negada', MFA_ENABLED: 'MFA Ativado',
  MFA_DISABLED: 'MFA Desativado', MFA_CHALLENGE: 'Desafio MFA',
  API_KEY_CREATED: 'API Key Criada', API_KEY_ROTATED: 'API Key Rotacionada',
  API_KEY_REVOKED: 'API Key Revogada', SSO_LOGIN: 'Login SSO',
  PASSWORD_CHANGED: 'Senha Alterada', SUSPICIOUS_ACTIVITY: 'Atividade Suspeita',
  RATE_LIMIT_EXCEEDED: 'Rate Limit Excedido', UNAUTHORIZED_ACCESS: 'Acesso Não Autorizado',
  ROLE_CHANGED: 'Perfil Alterado', EXPORT_DATA: 'Exportação de Dados',
  BULK_ACTION: 'Ação em Massa', CONFIG_CHANGED: 'Configuração Alterada',
  FORM_PUBLISHED: 'Formulário Publicado', TERM_UPDATED: 'Termo Atualizado',
  COURSE_PUBLISHED: 'Curso Publicado', THESIS_CREATED: 'Tese Criada',
  MATCHMAKING_RUN: 'Matchmaking Executado', COMMISSION_CALCULATED: 'Comissão Calculada',
};

const acaoColors: Record<AcaoAdmin, string> = {
  criar: 'bg-green-500', editar: 'bg-blue-500', deletar: 'bg-destructive',
  aprovar: 'bg-emerald-500', rejeitar: 'bg-orange-500', ativar: 'bg-cyan-500',
  desativar: 'bg-muted-foreground', login: 'bg-purple-500', export: 'bg-yellow-500',
};

const acaoLabels: Record<AcaoAdmin, string> = {
  criar: 'Criou', editar: 'Editou', deletar: 'Excluiu',
  aprovar: 'Aprovou', rejeitar: 'Rejeitou', ativar: 'Ativou',
  desativar: 'Desativou', login: 'Fez login', export: 'Exportou',
};

const recursos = [
  { value: 'usuarios', label: 'Usuários' }, { value: 'operacoes', label: 'Operações' },
  { value: 'empresas', label: 'Empresas' }, { value: 'chamados', label: 'Chamados' },
  { value: 'comissoes', label: 'Comissões' }, { value: 'oportunidades', label: 'Oportunidades' },
  { value: 'teses', label: 'Teses' }, { value: 'equipe', label: 'Equipe Admin' },
  { value: 'cursos', label: 'Cursos' }, { value: 'categorias', label: 'Categorias' },
  { value: 'materiais', label: 'Materiais' }, { value: 'formularios', label: 'Formulários' },
  { value: 'configuracoes', label: 'Configurações' }, { value: 'seguranca', label: 'Segurança' },
  { value: 'permissoes', label: 'Permissões' }, { value: 'investidores', label: 'Investidores' },
  { value: 'relatorios', label: 'Relatórios' }, { value: 'rede', label: 'Rede' },
  { value: 'indicacoes', label: 'Indicações' }, { value: 'sistema', label: 'Sistema' },
];

const acoes: { value: AcaoAdmin; label: string }[] = [
  { value: 'criar', label: 'Criar' }, { value: 'editar', label: 'Editar' },
  { value: 'deletar', label: 'Deletar' }, { value: 'aprovar', label: 'Aprovar' },
  { value: 'rejeitar', label: 'Rejeitar' }, { value: 'ativar', label: 'Ativar' },
  { value: 'desativar', label: 'Desativar' }, { value: 'login', label: 'Login' },
  { value: 'export', label: 'Exportar' },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, value, label, borderColor, iconBg, iconColor }: {
  icon: React.ElementType; value: number; label: string;
  borderColor: string; iconBg: string; iconColor: string;
}) {
  return (
    <Card className={cn("border-0 border-l-4", borderColor)}>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={cn("p-3 rounded-xl", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminAuditoria() {
  const { isMaster } = useAdminPermissions();

  const [activeTab, setActiveTab] = useState('logs');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [recursoFilter, setRecursoFilter] = useState<string>('all');
  const [acaoFilter, setAcaoFilter] = useState<string>('all');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  // ── Data ─────────────────────────────────────────────────────────────────────

  const { useLogs } = useAdminLogs();
  const { data: logsData, isLoading: loadingLogs, refetch: refetchLogs } = useLogs(1, 500, {
    recurso: recursoFilter !== 'all' ? recursoFilter : undefined,
    acao: acaoFilter !== 'all' ? acaoFilter as AcaoAdmin : undefined,
  });

  const { data: securityEvents, isLoading: loadingEvents, refetch: refetchEvents } = useQuery({
    queryKey: ['security-events', severityFilter, eventTypeFilter],
    queryFn: async () => {
      let query = supabase.from('security_events').select('*').order('created_at', { ascending: false }).limit(1000);
      if (severityFilter !== 'all') query = query.eq('severity', severityFilter);
      if (eventTypeFilter !== 'all') query = query.eq('event_type', eventTypeFilter);
      const { data, error } = await query;
      if (error) { console.error('Failed to fetch security events:', error); return []; }
      return data as SecurityEventRow[];
    },
  });

  const { data: permissionAudit, isLoading: loadingAudit, refetch: refetchAudit } = useQuery({
    queryKey: ['permission-audit'],
    queryFn: async () => {
      const { data, error } = await supabase.from('permission_audit').select('*').order('created_at', { ascending: false }).limit(500);
      if (error) { console.error('Failed to fetch permission audit:', error); return []; }
      return data as PermissionAuditRow[];
    },
  });

  // ── Filtering ────────────────────────────────────────────────────────────────

  const filteredLogs = useMemo(() => {
    if (!logsData?.logs) return [];
    let logs = logsData.logs;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      logs = logs.filter(l =>
        l.admin?.profile?.nome?.toLowerCase().includes(q) ||
        l.descricao?.toLowerCase().includes(q) ||
        l.recurso?.toLowerCase().includes(q)
      );
    }
    return logs;
  }, [logsData?.logs, searchQuery]);

  const filteredEvents = useMemo(() => {
    if (!securityEvents) return [];
    if (!searchQuery.trim()) return securityEvents;
    const q = searchQuery.toLowerCase();
    return securityEvents.filter(e =>
      e.description?.toLowerCase().includes(q) ||
      e.user_email?.toLowerCase().includes(q) ||
      e.event_type?.toLowerCase().includes(q)
    );
  }, [securityEvents, searchQuery]);

  const filteredAudit = useMemo(() => {
    if (!permissionAudit) return [];
    if (!searchQuery.trim()) return permissionAudit;
    const q = searchQuery.toLowerCase();
    return permissionAudit.filter(a =>
      a.permission?.toLowerCase().includes(q) ||
      a.resource_type?.toLowerCase().includes(q)
    );
  }, [permissionAudit, searchQuery]);

  const currentTabData = activeTab === 'security' ? filteredEvents : activeTab === 'permissions' ? filteredAudit : filteredLogs;
  const isLoading = activeTab === 'security' ? loadingEvents : activeTab === 'permissions' ? loadingAudit : loadingLogs;

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return currentTabData.slice(start, start + pageSize);
  }, [currentTabData, currentPage, pageSize]);

  const totalPages = Math.ceil(currentTabData.length / pageSize);

  // ── Stats ────────────────────────────────────────────────────────────────────

  const logStats = useMemo(() => {
    if (!logsData?.logs) return { total: 0, hoje: 0, editar: 0, criar: 0, deletar: 0, export: 0, aprovar: 0 };
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    return {
      total: logsData.logs.length,
      hoje: logsData.logs.filter(l => new Date(l.created_at) >= hoje).length,
      editar: logsData.logs.filter(l => l.acao === 'editar').length,
      criar: logsData.logs.filter(l => l.acao === 'criar').length,
      deletar: logsData.logs.filter(l => l.acao === 'deletar').length,
      export: logsData.logs.filter(l => l.acao === 'export').length,
      aprovar: logsData.logs.filter(l => l.acao === 'aprovar' || l.acao === 'rejeitar').length,
    };
  }, [logsData?.logs]);

  const securityStats = useMemo(() => {
    if (!securityEvents) return { total: 0, critical: 0, failedLogins: 0, suspicious: 0 };
    return {
      total: securityEvents.length,
      critical: securityEvents.filter(e => e.severity === 'critical').length,
      failedLogins: securityEvents.filter(e => e.event_type === 'LOGIN_FAILED').length,
      suspicious: securityEvents.filter(e => e.event_type === 'SUSPICIOUS_ACTIVITY').length,
    };
  }, [securityEvents]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const toggleExpanded = (id: string) => {
    setExpandedLogs(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const handleRefresh = () => {
    if (activeTab === 'logs') refetchLogs();
    else if (activeTab === 'security') refetchEvents();
    else refetchAudit();
    toast.success('Dados atualizados');
  };

  const handleClearFilters = () => {
    setSearchQuery(''); setSeverityFilter('all'); setEventTypeFilter('all');
    setRecursoFilter('all'); setAcaoFilter('all'); setCurrentPage(1);
  };

  const handleExportCSV = () => {
    if (!currentTabData.length) { toast.error('Nenhum dado para exportar'); return; }
    let csv = '';
    if (activeTab === 'logs') {
      const headers = ['Data', 'Admin', 'Ação', 'Recurso', 'Descrição'];
      const rows = filteredLogs.map(l => [
        format(new Date(l.created_at), 'yyyy-MM-dd HH:mm:ss'),
        l.admin?.profile?.nome || 'Admin', l.acao, l.recurso, l.descricao || '',
      ]);
      csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    } else if (activeTab === 'security') {
      const headers = ['Data', 'Tipo', 'Severidade', 'Descrição', 'Usuário', 'IP'];
      const rows = (currentTabData as SecurityEventRow[]).map(e => [
        format(new Date(e.created_at), 'yyyy-MM-dd HH:mm:ss'),
        e.event_type, e.severity, e.description, e.user_email || '', e.ip_address || '',
      ]);
      csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    } else {
      const headers = ['Data', 'Usuário', 'Permissão', 'Permitido', 'Recurso'];
      const rows = (currentTabData as PermissionAuditRow[]).map(a => [
        format(new Date(a.created_at), 'yyyy-MM-dd HH:mm:ss'),
        a.user_id, a.permission, a.allowed ? 'Sim' : 'Não', a.resource_type || '',
      ]);
      csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url;
    link.download = `auditoria-${activeTab}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click(); window.URL.revokeObjectURL(url);
    toast.success('CSV exportado com sucesso');
  };

  // ── Guard ───────────────────────────────────────────────────────────────────

  if (!isMaster) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="border-0 max-w-md"><CardContent className="pt-6 text-center">
          <Lock className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-semibold mb-1">Acesso Restrito</h2>
          <p className="text-sm text-muted-foreground">Apenas administradores Master podem acessar esta página.</p>
        </CardContent></Card>
      </div>
    );
  }

  // ── Stats for current tab ───────────────────────────────────────────────────

  const statsForTab = activeTab === 'logs' ? [
    { icon: ScrollText, value: logStats.total, label: 'Total de Logs', borderColor: 'border-l-blue-500', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-500' },
    { icon: Clock, value: logStats.hoje, label: 'Ações Hoje', borderColor: 'border-l-green-500', iconBg: 'bg-green-500/10', iconColor: 'text-green-500' },
    { icon: Activity, value: logStats.editar, label: 'Edições', borderColor: 'border-l-purple-500', iconBg: 'bg-purple-500/10', iconColor: 'text-purple-500' },
    { icon: CheckCircle2, value: logStats.criar, label: 'Criações', borderColor: 'border-l-cyan-500', iconBg: 'bg-cyan-500/10', iconColor: 'text-cyan-500' },
  ] : activeTab === 'security' ? [
    { icon: ShieldAlert, value: securityStats.total, label: 'Total Eventos', borderColor: 'border-l-blue-500', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-500' },
    { icon: AlertTriangle, value: securityStats.critical, label: 'Críticos', borderColor: 'border-l-red-500', iconBg: 'bg-red-500/10', iconColor: 'text-red-500' },
    { icon: LogIn, value: securityStats.failedLogins, label: 'Logins Falhados', borderColor: 'border-l-orange-500', iconBg: 'bg-orange-500/10', iconColor: 'text-orange-500' },
    { icon: Eye, value: securityStats.suspicious, label: 'Suspeitas', borderColor: 'border-l-yellow-500', iconBg: 'bg-yellow-500/10', iconColor: 'text-yellow-500' },
  ] : [
    { icon: Lock, value: permissionAudit?.length || 0, label: 'Total Auditorias', borderColor: 'border-l-blue-500', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-500' },
    { icon: CheckCircle2, value: permissionAudit?.filter(a => a.allowed).length || 0, label: 'Permitidas', borderColor: 'border-l-green-500', iconBg: 'bg-green-500/10', iconColor: 'text-green-500' },
    { icon: XCircle, value: permissionAudit?.filter(a => !a.allowed).length || 0, label: 'Negadas', borderColor: 'border-l-red-500', iconBg: 'bg-red-500/10', iconColor: 'text-red-500' },
    { icon: Activity, value: 0, label: 'Alertas', borderColor: 'border-l-orange-500', iconBg: 'bg-orange-500/10', iconColor: 'text-orange-500' },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <AdminBreadcrumb items={[{ label: 'Auditoria & Logs' }]} />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Auditoria & Logs</h1>
            <p className="text-sm text-muted-foreground mt-1">Monitore todas as ações administrativas e eventos de segurança</p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip><TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleRefresh}><RefreshCw className="h-4 w-4" /></Button>
            </TooltipTrigger><TooltipContent>Atualizar</TooltipContent></Tooltip>
            <Button variant="outline" onClick={handleExportCSV} className="gap-2">
              <Download className="h-4 w-4" />Exportar CSV
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          {statsForTab.map(s => <StatCard key={s.label} {...s} />)}
        </div>

        {/* Filters */}
        <Card className="border-0">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar..." value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="pl-9 text-sm" />
              </div>
              {activeTab === 'logs' && (
                <>
                  <Select value={recursoFilter} onValueChange={(v) => { setRecursoFilter(v); setCurrentPage(1); }}>
                    <SelectTrigger className="w-[160px] text-sm"><SelectValue placeholder="Recurso" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Recursos</SelectItem>
                      {recursos.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={acaoFilter} onValueChange={(v) => { setAcaoFilter(v); setCurrentPage(1); }}>
                    <SelectTrigger className="w-[160px] text-sm"><SelectValue placeholder="Ação" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas Ações</SelectItem>
                      {acoes.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </>
              )}
              {activeTab === 'security' && (
                <>
                  <Select value={severityFilter} onValueChange={(v) => { setSeverityFilter(v); setCurrentPage(1); }}>
                    <SelectTrigger className="w-[150px] text-sm"><SelectValue placeholder="Severidade" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="critical">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={eventTypeFilter} onValueChange={(v) => { setEventTypeFilter(v); setCurrentPage(1); }}>
                    <SelectTrigger className="w-[180px] text-sm"><SelectValue placeholder="Tipo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {Object.entries(eventTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </>
              )}
              <Button variant="outline" size="sm" onClick={handleClearFilters} className="shrink-0 text-xs">Limpar</Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className="border-0">
          <CardHeader className="pb-3">
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(1); }}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Eye className="h-4 w-4" />
                  Registros
                  <Badge variant="secondary" className="text-xs">{currentTabData.length}</Badge>
                </CardTitle>
                <TabsList>
                  <TabsTrigger value="logs" className="gap-1.5 text-xs">
                    <ScrollText className="h-3.5 w-3.5" />Logs
                    <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">{logsData?.logs?.length || 0}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="security" className="gap-1.5 text-xs">
                    <ShieldAlert className="h-3.5 w-3.5" />Segurança
                    <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">{securityEvents?.length || 0}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="permissions" className="gap-1.5 text-xs">
                    <Lock className="h-3.5 w-3.5" />Permissões
                    <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">{permissionAudit?.length || 0}</Badge>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* ── Tab: Logs ── */}
              <TabsContent value="logs" className="mt-0">
                {loadingLogs ? (
                  <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
                ) : paginatedData.length > 0 ? (
                  <div className="space-y-2">
                    {(paginatedData as import('@/hooks/useAdminLogs').AdminLog[]).map(log => (
                      <Collapsible key={log.id} open={expandedLogs.has(log.id)}>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="rounded-lg border border-border/30 bg-card hover:bg-muted/30 transition-colors"
                        >
                          <CollapsibleTrigger onClick={() => toggleExpanded(log.id)} className="w-full">
                            <div className="flex items-center gap-4 p-4">
                              <Avatar className="h-9 w-9 shrink-0">
                                <AvatarImage src={log.admin?.profile?.avatar_url || ''} />
                                <AvatarFallback className="text-xs">{log.admin?.profile?.nome?.charAt(0) || 'A'}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm">{log.admin?.profile?.nome || 'Admin'}</span>
                                  <Badge className={cn('text-white text-[10px] px-1.5 py-0', acaoColors[log.acao])}>
                                    {acaoLabels[log.acao] || log.acao}
                                  </Badge>
                                  <Badge variant="outline" className="text-[10px] capitalize">{log.recurso}</Badge>
                                </div>
                                {log.descricao && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{log.descricao}</p>}
                              </div>
                              <span className="text-[11px] text-muted-foreground whitespace-nowrap hidden md:block">
                                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                              </span>
                              {(log.dados_anteriores || log.dados_novos) && (
                                expandedLogs.has(log.id) ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                              )}
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            {(log.dados_anteriores || log.dados_novos) && (
                              <div className="px-4 pb-4 border-t border-border/20 mx-4 pt-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {log.dados_anteriores && (
                                    <div>
                                      <p className="text-[10px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Antes</p>
                                      <pre className="text-[11px] bg-muted/50 p-3 rounded-lg overflow-auto max-h-40 font-mono">
                                        {JSON.stringify(log.dados_anteriores, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                  {log.dados_novos && (
                                    <div>
                                      <p className="text-[10px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Depois</p>
                                      <pre className="text-[11px] bg-muted/50 p-3 rounded-lg overflow-auto max-h-40 font-mono">
                                        {JSON.stringify(log.dados_novos, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </CollapsibleContent>
                        </motion.div>
                      </Collapsible>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={ScrollText} text="Nenhum log encontrado" />
                )}
              </TabsContent>

              {/* ── Tab: Security ── */}
              <TabsContent value="security" className="mt-0">
                {loadingEvents ? (
                  <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
                ) : (paginatedData as SecurityEventRow[]).length > 0 ? (
                  <div className="space-y-2">
                    {(paginatedData as SecurityEventRow[]).map(event => {
                      const sev = severityConfig[event.severity] || severityConfig.low;
                      return (
                        <motion.div key={event.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="flex items-center gap-4 p-4 rounded-lg border border-border/30 bg-card hover:bg-muted/30 transition-colors"
                        >
                          <div className={cn("p-2.5 rounded-lg shrink-0", sev.bgColor)}>
                            <ShieldAlert className={cn("h-4 w-4", sev.textColor)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <span className="font-medium text-sm">{event.user_email || event.user_id?.substring(0, 8) || 'Sistema'}</span>
                              <Badge variant="outline" className="text-[10px]">{eventTypeLabels[event.event_type] || event.event_type}</Badge>
                              <Badge className={cn("text-[10px] border", sev.bgColor, sev.textColor)} variant="outline">
                                <span className={cn("w-1.5 h-1.5 rounded-full mr-1", sev.dotColor)} />
                                {sev.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1">{event.description}</p>
                          </div>
                          <div className="hidden md:flex flex-col items-end gap-1 shrink-0">
                            {event.ip_address && <span className="text-[10px] font-mono text-muted-foreground">{event.ip_address}</span>}
                            <span className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: ptBR })}
                            </span>
                          </div>
                          <Badge variant="outline" className={cn("text-[10px] shrink-0",
                            event.resolved ? "bg-primary/10 text-primary border-primary/20" : "bg-muted/50 text-muted-foreground"
                          )}>
                            {event.resolved ? 'Resolvido' : 'Pendente'}
                          </Badge>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState icon={ShieldAlert} text="Nenhum evento de segurança encontrado" />
                )}
              </TabsContent>

              {/* ── Tab: Permissions ── */}
              <TabsContent value="permissions" className="mt-0">
                {loadingAudit ? (
                  <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
                ) : (paginatedData as PermissionAuditRow[]).length > 0 ? (
                  <div className="space-y-2">
                    {(paginatedData as PermissionAuditRow[]).map(audit => (
                      <motion.div key={audit.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex items-center gap-4 p-4 rounded-lg border border-border/30 bg-card hover:bg-muted/30 transition-colors"
                      >
                        <div className={cn("p-2.5 rounded-lg shrink-0", audit.allowed ? "bg-primary/10" : "bg-destructive/10")}>
                          {audit.allowed ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <XCircle className="h-4 w-4 text-destructive" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="font-mono text-xs text-muted-foreground">{audit.user_id?.substring(0, 12)}...</span>
                            <Badge variant="outline" className="text-[10px] font-mono bg-muted/50">{audit.permission}</Badge>
                          </div>
                          {audit.resource_type && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-[10px] capitalize">{audit.resource_type}</Badge>
                              {audit.resource_id && <span className="font-mono text-[10px]">{audit.resource_id.substring(0, 8)}</span>}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap hidden md:block">
                          {formatDistanceToNow(new Date(audit.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                        <Badge variant="outline" className={cn("text-[10px] shrink-0",
                          audit.allowed ? "bg-primary/10 text-primary border-primary/20" : "bg-destructive/10 text-destructive border-destructive/20"
                        )}>
                          {audit.allowed ? 'Permitido' : 'Negado'}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Lock} text="Nenhum registro de auditoria encontrado" />
                )}
              </TabsContent>

              {currentTabData.length > 0 && (
                <div className="mt-4">
                  <AdminPagination
                    currentPage={currentPage} totalPages={totalPages}
                    totalItems={currentTabData.length} pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                  />
                </div>
              )}
            </Tabs>
          </CardHeader>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="text-center py-16 text-muted-foreground">
      <div className="p-4 rounded-full bg-muted/30 w-fit mx-auto mb-4">
        <Icon className="h-8 w-8 opacity-40" />
      </div>
      <p className="text-sm font-medium">{text}</p>
      <p className="text-xs mt-1">Tente ajustar os filtros ou volte mais tarde</p>
    </div>
  );
}
