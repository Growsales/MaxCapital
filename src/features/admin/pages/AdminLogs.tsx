import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ScrollText, Filter, Search, Download, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/card';
import { Badge } from '@/shared/components/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/avatar';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/select';
import { Skeleton } from '@/shared/components/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/components/collapsible';
import { useAdminLogs, type AcaoAdmin } from '@/hooks/useAdminLogs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AdminBreadcrumb } from '@/features/admin/components/AdminBreadcrumb';
import { AdminPagination } from '@/features/admin/components/AdminPagination';
import { exportToCSV } from '@/lib/export-csv';
import { toast } from 'sonner';

const acaoColors: Record<AcaoAdmin, string> = {
  criar: 'bg-green-500',
  editar: 'bg-blue-500',
  deletar: 'bg-red-500',
  aprovar: 'bg-emerald-500',
  rejeitar: 'bg-orange-500',
  ativar: 'bg-cyan-500',
  desativar: 'bg-gray-500',
  login: 'bg-purple-500',
  export: 'bg-yellow-500',
};

const acaoLabels: Record<AcaoAdmin, string> = {
  criar: 'Criou',
  editar: 'Editou',
  deletar: 'Excluiu',
  aprovar: 'Aprovou',
  rejeitar: 'Rejeitou',
  ativar: 'Ativou',
  desativar: 'Desativou',
  login: 'Fez login',
  export: 'Exportou',
};

const recursos = [
  { value: 'usuarios', label: 'Usuários' },
  { value: 'operacoes', label: 'Operações' },
  { value: 'empresas', label: 'Empresas' },
  { value: 'chamados', label: 'Chamados' },
  { value: 'comissoes', label: 'Comissões' },
  { value: 'oportunidades', label: 'Oportunidades' },
  { value: 'teses', label: 'Teses' },
  { value: 'equipe', label: 'Equipe Admin' },
];

const acoes: { value: AcaoAdmin; label: string }[] = [
  { value: 'criar', label: 'Criar' },
  { value: 'editar', label: 'Editar' },
  { value: 'deletar', label: 'Deletar' },
  { value: 'aprovar', label: 'Aprovar' },
  { value: 'rejeitar', label: 'Rejeitar' },
  { value: 'ativar', label: 'Ativar' },
  { value: 'desativar', label: 'Desativar' },
];

export default function AdminLogs() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [recursoFilter, setRecursoFilter] = useState<string>('all');
  const [acaoFilter, setAcaoFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const { useLogs } = useAdminLogs();
  const { data, isLoading } = useLogs(1, 500, {
    recurso: recursoFilter !== 'all' ? recursoFilter : undefined,
    acao: acaoFilter !== 'all' ? acaoFilter as AcaoAdmin : undefined,
  });

  // Filter and paginate logs
  const filteredLogs = useMemo(() => {
    if (!data?.logs) return [];
    let logs = data.logs;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      logs = logs.filter(log => 
        log.admin?.profile?.nome?.toLowerCase().includes(query) ||
        log.descricao?.toLowerCase().includes(query) ||
        log.recurso?.toLowerCase().includes(query)
      );
    }

    return logs;
  }, [data?.logs, searchQuery]);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize);

  const handleFilterChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  const toggleExpanded = (logId: string) => {
    setExpandedLogs(prev => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  };

  const formatJson = (data: Record<string, unknown> | null) => {
    if (!data) return null;
    return JSON.stringify(data, null, 2);
  };

  // Stats
  const stats = useMemo(() => {
    if (!data?.logs) return { total: 0, hoje: 0, editar: 0, criar: 0 };
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    return {
      total: data.logs.length,
      hoje: data.logs.filter(l => new Date(l.created_at) >= hoje).length,
      editar: data.logs.filter(l => l.acao === 'editar').length,
      criar: data.logs.filter(l => l.acao === 'criar').length,
    };
  }, [data?.logs]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Breadcrumb */}
      <AdminBreadcrumb items={[{ label: 'Logs de Auditoria' }]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logs de Auditoria</h1>
          <p className="text-muted-foreground">Acompanhe todas as ações administrativas</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => {
          if (!filteredLogs.length) { toast.error('Nenhum log para exportar'); return; }
          exportToCSV(
            filteredLogs.map(log => ({
              data: format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
              admin: log.admin?.profile?.nome || 'Admin',
              acao: acaoLabels[log.acao] || log.acao,
              recurso: log.recurso,
              descricao: log.descricao || '',
            })),
            'logs_auditoria',
            { data: 'Data', admin: 'Admin', acao: 'Ação', recurso: 'Recurso', descricao: 'Descrição' }
          );
          toast.success('Logs exportados com sucesso!');
        }}>
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
              <p className="text-xs text-muted-foreground">Total de Logs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/10">
              <ScrollText className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.hoje}</p>
              <p className="text-xs text-muted-foreground">Ações Hoje</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/10">
              <ScrollText className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.editar}</p>
              <p className="text-xs text-muted-foreground">Edições</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/10">
              <ScrollText className="h-5 w-5 text-cyan-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.criar}</p>
              <p className="text-xs text-muted-foreground">Criações</p>
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
                placeholder="Buscar por admin, descrição..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={recursoFilter} onValueChange={handleFilterChange(setRecursoFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Recurso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Recursos</SelectItem>
                {recursos.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={acaoFilter} onValueChange={handleFilterChange(setAcaoFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Ações</SelectItem>
                {acoes.map(a => (
                  <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card className="border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            Histórico ({filteredLogs.length} registros)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-6 pt-0">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : paginatedLogs.length > 0 ? (
              <div className="space-y-3">
                {paginatedLogs.map(log => (
                  <Collapsible key={log.id} open={expandedLogs.has(log.id)}>
                    <div className="rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <CollapsibleTrigger 
                        onClick={() => toggleExpanded(log.id)}
                        className="w-full"
                      >
                        <div className="flex items-start gap-4 p-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={log.admin?.profile?.avatar_url || ''} />
                            <AvatarFallback>{log.admin?.profile?.nome?.charAt(0) || 'A'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-medium">{log.admin?.profile?.nome || 'Admin'}</span>
                              <Badge className={cn('text-white text-xs', acaoColors[log.acao])}>
                                {acaoLabels[log.acao] || log.acao}
                              </Badge>
                              <Badge variant="outline" className="text-xs capitalize">{log.recurso}</Badge>
                            </div>
                            {log.descricao && (
                              <p className="text-sm text-muted-foreground line-clamp-1">{log.descricao}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {(log.dados_anteriores || log.dados_novos) && (
                              expandedLogs.has(log.id) ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        {(log.dados_anteriores || log.dados_novos) && (
                          <div className="px-4 pb-4 pt-0 border-t mx-4 mt-2">
                            <div className="grid grid-cols-2 gap-4 pt-4">
                              {log.dados_anteriores && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-2">Dados Anteriores</p>
                                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-48">
                                    {formatJson(log.dados_anteriores)}
                                  </pre>
                                </div>
                              )}
                              {log.dados_novos && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-2">Dados Novos</p>
                                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-48">
                                    {formatJson(log.dados_novos)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <ScrollText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum log encontrado</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredLogs.length > 0 && (
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredLogs.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
