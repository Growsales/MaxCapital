import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ScrollText, Search, Download, ShieldAlert,
  AlertTriangle, LogIn, Activity, Eye,
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
import { cn } from '@/lib/utils';
import { AdminBreadcrumb } from '@/features/admin/components/AdminBreadcrumb';
import { AdminPagination } from '@/features/admin/components/AdminPagination';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

const severityConfig: Record<string, { label: string; color: string; icon: typeof ShieldAlert }> = {
  low: { label: 'Baixa', color: 'bg-gray-100 text-gray-800', icon: Activity },
  medium: { label: 'Média', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
  critical: { label: 'Crítica', color: 'bg-red-100 text-red-800', icon: ShieldAlert },
};

const eventTypeLabels: Record<string, string> = {
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  LOGIN_FAILED: 'Login Falhou',
  PERMISSION_DENIED: 'Permissão Negada',
  MFA_ENABLED: 'MFA Ativado',
  MFA_DISABLED: 'MFA Desativado',
  MFA_CHALLENGE: 'Desafio MFA',
  API_KEY_CREATED: 'API Key Criada',
  API_KEY_ROTATED: 'API Key Rotacionada',
  API_KEY_REVOKED: 'API Key Revogada',
  SSO_LOGIN: 'Login SSO',
  PASSWORD_CHANGED: 'Senha Alterada',
  SUSPICIOUS_ACTIVITY: 'Atividade Suspeita',
  RATE_LIMIT_EXCEEDED: 'Rate Limit Excedido',
  UNAUTHORIZED_ACCESS: 'Acesso Não Autorizado',
};

export function AuditDashboard() {
  const [activeTab, setActiveTab] = useState('security');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Security Events query
  const { data: securityEvents, isLoading: loadingEvents } = useQuery({
    queryKey: ['security-events', severityFilter, eventTypeFilter, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (severityFilter !== 'all') {
        query = query.eq('severity', severityFilter);
      }
      if (eventTypeFilter !== 'all') {
        query = query.eq('event_type', eventTypeFilter);
      }
      if (startDate) {
        query = query.gte('created_at', new Date(startDate).toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', new Date(endDate).toISOString());
      }

      const { data, error } = await query;
      if (error) {
        console.error('Failed to fetch security events:', error);
        return [];
      }
      return data as SecurityEventRow[];
    },
  });

  // Permission Audit query
  const { data: permissionAudit, isLoading: loadingAudit } = useQuery({
    queryKey: ['permission-audit'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permission_audit')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        console.error('Failed to fetch permission audit:', error);
        return [];
      }
      return data as PermissionAuditRow[];
    },
  });

  // Filter security events by search
  const filteredEvents = useMemo(() => {
    if (!securityEvents) return [];
    if (!searchQuery.trim()) return securityEvents;
    const query = searchQuery.toLowerCase();
    return securityEvents.filter((e) =>
      e.description?.toLowerCase().includes(query) ||
      e.user_email?.toLowerCase().includes(query) ||
      e.event_type?.toLowerCase().includes(query) ||
      e.ip_address?.includes(query)
    );
  }, [securityEvents, searchQuery]);

  // Filter permission audit by search
  const filteredAudit = useMemo(() => {
    if (!permissionAudit) return [];
    if (!searchQuery.trim()) return permissionAudit;
    const query = searchQuery.toLowerCase();
    return permissionAudit.filter((a) =>
      a.permission?.toLowerCase().includes(query) ||
      a.resource_type?.toLowerCase().includes(query) ||
      a.user_id?.includes(query)
    );
  }, [permissionAudit, searchQuery]);

  const currentData = activeTab === 'security' ? filteredEvents : filteredAudit;
  const isLoading = activeTab === 'security' ? loadingEvents : loadingAudit;

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return currentData.slice(start, start + pageSize);
  }, [currentData, currentPage, pageSize]);

  const totalPages = Math.ceil(currentData.length / pageSize);

  // Stats
  const stats = useMemo(() => {
    if (!securityEvents) return { total: 0, critical: 0, failedLogins: 0, suspicious: 0 };
    return {
      total: securityEvents.length,
      critical: securityEvents.filter((e) => e.severity === 'critical').length,
      failedLogins: securityEvents.filter((e) => e.event_type === 'LOGIN_FAILED').length,
      suspicious: securityEvents.filter((e) => e.event_type === 'SUSPICIOUS_ACTIVITY').length,
    };
  }, [securityEvents]);

  const handleExportCSV = () => {
    if (!currentData.length) return;

    let csv: string;
    if (activeTab === 'security') {
      const headers = ['Data', 'Tipo', 'Severidade', 'Descrição', 'Usuário', 'IP'];
      const rows = (currentData as SecurityEventRow[]).map((e) => [
        format(new Date(e.created_at), 'yyyy-MM-dd HH:mm:ss'),
        e.event_type,
        e.severity,
        e.description,
        e.user_email || e.user_id || '',
        e.ip_address || '',
      ]);
      csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    } else {
      const headers = ['Data', 'Usuário', 'Permissão', 'Permitido', 'Recurso', 'Recurso ID'];
      const rows = (currentData as PermissionAuditRow[]).map((a) => [
        format(new Date(a.created_at), 'yyyy-MM-dd HH:mm:ss'),
        a.user_id,
        a.permission,
        a.allowed ? 'Sim' : 'Não',
        a.resource_type || '',
        a.resource_id || '',
      ]);
      csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-${activeTab}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSeverityFilter('all');
    setEventTypeFilter('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <AdminBreadcrumb items={[{ label: 'Dashboard de Auditoria' }]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Auditoria</h1>
          <p className="text-muted-foreground">Monitore eventos de segurança e auditoria de permissões</p>
        </div>
        <Button variant="outline" onClick={handleExportCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <ScrollText className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total de Eventos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-500/10">
              <ShieldAlert className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.critical}</p>
              <p className="text-xs text-muted-foreground">Eventos Críticos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-500/10">
              <LogIn className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.failedLogins}</p>
              <p className="text-xs text-muted-foreground">Logins Falhados</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-500/10">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.suspicious}</p>
              <p className="text-xs text-muted-foreground">Atividades Suspeitas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição, email, IP..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-9"
              />
            </div>

            {activeTab === 'security' && (
              <>
                <Select value={severityFilter} onValueChange={(v) => { setSeverityFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Severidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={eventTypeFilter} onValueChange={(v) => { setEventTypeFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tipo de Evento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="LOGIN">Login</SelectItem>
                    <SelectItem value="LOGIN_FAILED">Login Falhado</SelectItem>
                    <SelectItem value="PERMISSION_DENIED">Permissão Negada</SelectItem>
                    <SelectItem value="SUSPICIOUS_ACTIVITY">Atividade Suspeita</SelectItem>
                    <SelectItem value="RATE_LIMIT_EXCEEDED">Rate Limit</SelectItem>
                    <SelectItem value="UNAUTHORIZED_ACCESS">Acesso Não Autorizado</SelectItem>
                    <SelectItem value="PASSWORD_CHANGED">Senha Alterada</SelectItem>
                    <SelectItem value="API_KEY_CREATED">API Key Criada</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}

            <Input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
              className="w-[160px]"
              placeholder="Data inicial"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
              className="w-[160px]"
              placeholder="Data final"
            />

            <Button variant="outline" onClick={handleClearFilters} className="shrink-0">
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content with Tabs */}
      <Card className="border-0">
        <CardHeader>
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(1); }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Registros ({currentData.length})
              </CardTitle>
              <TabsList>
                <TabsTrigger value="security" className="gap-2">
                  <ShieldAlert className="h-4 w-4" />
                  Eventos de Segurança
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {securityEvents?.length || 0}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="permissions" className="gap-2">
                  <ScrollText className="h-4 w-4" />
                  Auditoria de Permissões
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {permissionAudit?.length || 0}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="security" className="mt-4">
              {loadingEvents ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : paginatedData.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-3 font-medium">Data</th>
                        <th className="text-left p-3 font-medium">Tipo</th>
                        <th className="text-left p-3 font-medium">Severidade</th>
                        <th className="text-left p-3 font-medium">Descrição</th>
                        <th className="text-left p-3 font-medium">Usuário</th>
                        <th className="text-left p-3 font-medium">IP</th>
                        <th className="text-left p-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(paginatedData as SecurityEventRow[]).map((event, idx) => {
                        const severity = severityConfig[event.severity] || severityConfig.low;
                        return (
                          <tr key={event.id} className={cn('border-t hover:bg-muted/50 transition-colors', idx % 2 === 0 && 'bg-muted/20')}>
                            <td className="p-3 whitespace-nowrap text-sm">
                              {format(new Date(event.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </td>
                            <td className="p-3">
                              <Badge variant="outline" className="text-xs">
                                {eventTypeLabels[event.event_type] || event.event_type}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <Badge className={cn('text-xs', severity.color)}>
                                {severity.label}
                              </Badge>
                            </td>
                            <td className="p-3 max-w-xs truncate text-sm">{event.description}</td>
                            <td className="p-3 text-sm">{event.user_email || event.user_id?.substring(0, 8) || '-'}</td>
                            <td className="p-3 font-mono text-xs">{event.ip_address || '-'}</td>
                            <td className="p-3">
                              <Badge className={cn('text-xs', event.resolved ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')}>
                                {event.resolved ? 'Resolvido' : 'Pendente'}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ShieldAlert className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum evento de segurança encontrado</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="permissions" className="mt-4">
              {loadingAudit ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : paginatedData.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-3 font-medium">Data</th>
                        <th className="text-left p-3 font-medium">Usuário</th>
                        <th className="text-left p-3 font-medium">Permissão</th>
                        <th className="text-left p-3 font-medium">Resultado</th>
                        <th className="text-left p-3 font-medium">Recurso</th>
                        <th className="text-left p-3 font-medium">Contexto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(paginatedData as PermissionAuditRow[]).map((audit, idx) => (
                        <tr key={audit.id} className={cn('border-t hover:bg-muted/50 transition-colors', idx % 2 === 0 && 'bg-muted/20')}>
                          <td className="p-3 whitespace-nowrap text-sm">
                            {format(new Date(audit.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </td>
                          <td className="p-3 text-sm font-mono">{audit.user_id?.substring(0, 8)}...</td>
                          <td className="p-3">
                            <code className="text-xs bg-muted px-2 py-1 rounded">{audit.permission}</code>
                          </td>
                          <td className="p-3">
                            <Badge className={cn('text-xs', audit.allowed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                              {audit.allowed ? 'Permitido' : 'Negado'}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm">
                            {audit.resource_type ? (
                              <span>
                                <Badge variant="outline" className="text-xs capitalize">{audit.resource_type}</Badge>
                                {audit.resource_id && (
                                  <span className="ml-1 font-mono text-xs text-muted-foreground">
                                    {audit.resource_id.substring(0, 8)}
                                  </span>
                                )}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="p-3 text-xs text-muted-foreground max-w-xs truncate">
                            {audit.context ? JSON.stringify(audit.context) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ScrollText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum registro de auditoria encontrado</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {currentData.length > 0 && (
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={currentData.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />
          )}
        </CardHeader>
      </Card>
    </motion.div>
  );
}
