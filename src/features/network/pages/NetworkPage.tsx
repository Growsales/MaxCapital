import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Loader2,
  UserPlus,
  GitBranch,
  BarChart3,
  ChevronRight,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/tabs';
import { Card, CardContent } from '@/shared/components/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/popover';
import { Badge } from '@/shared/components/badge';
import { useMembrosRede, useRedeStats } from '@/features/network/api/useRede';
import ReferralCard from '@/features/network/components/ReferralCard';
import MemberDetailModal from '@/features/network/components/MemberDetailModal';
import NetworkOverviewTab from '@/features/network/components/NetworkOverviewTab';
import { exportToCSV } from '@/lib/export-csv';
import { toast } from 'sonner';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('pt-BR');

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function NetworkPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterTipo, setFilterTipo] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedMembro, setSelectedMembro] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const { data: membrosRede = [], isLoading } = useMembrosRede(searchQuery);
  const { data: stats } = useRedeStats();

  const activeFilterCount = [filterStatus, filterTipo].filter(Boolean).length;

  // Read configurable commission % from admin settings (default 15%)
  const comissaoPercent = useMemo(() => {
    try {
      const cached = localStorage.getItem('admin-configuracoes-cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        const val = parseFloat(parsed.comissao_potenciais_ganhos);
        if (!isNaN(val) && val > 0) return val / 100;
      }
    } catch { /* ignore */ }
    return 0.15;
  }, []);

  const filteredMembros = useMemo(() => {
    let result = membrosRede;
    if (filterStatus) result = result.filter(m => m.status === filterStatus);
    if (filterTipo) result = result.filter(m => filterTipo === 'Direta' ? m.indicacao === 'Direta' : m.indicacao !== 'Direta');
    return result;
  }, [membrosRede, filterStatus, filterTipo]);

  const indiretasList = useMemo(() => filteredMembros.filter(m => m.indicacao !== 'Direta'), [filteredMembros]);
  const diretasList = useMemo(() => filteredMembros.filter(m => m.indicacao === 'Direta'), [filteredMembros]);

  const handleOpenDetail = (membro: typeof membrosRede[0]) => {
    const withIndiretas = {
      ...membro,
      indiretas: membro.indicacao === 'Direta' ? indiretasList : [],
      indicado_por: membro.indicacao !== 'Direta' && diretasList.length > 0
        ? { id: diretasList[0].id, nome: diretasList[0].usuario?.nome || 'N/A', email: diretasList[0].usuario?.email }
        : undefined,
    };
    setSelectedMembro(withIndiretas);
    setDetailOpen(true);
  };

  const totalIndicados = stats?.totalIndicados || 0;
  const indicacoesDiretas = stats?.indicacoesDiretas || 0;
  const totalNegocios = stats?.totalNegocios || 0;
  const valorTotal = stats?.valorTotal || 0;

  const handleExport = () => {
    if (!membrosRede.length) { toast.error('Nenhum dado para exportar'); return; }
    exportToCSV(
      membrosRede.map(m => ({
        indicacao: m.indicacao,
        nivel: m.nivel,
        nome: m.usuario?.nome || 'N/A',
        negocios: m.numero_negocios,
        valor: m.valor_total || 0,
        ultimo_negocio: m.ultimo_negocio || '-',
        status: m.status,
      })),
      'minha_rede',
      { indicacao: 'Indicação', nivel: 'Nível', nome: 'Nome', negocios: 'Nº Negócios', valor: 'Valor Total', ultimo_negocio: 'Último Negócio', status: 'Status' }
    );
    toast.success('Rede exportada com sucesso!');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Minha Rede</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie suas indicações e acompanhe o desempenho da sua rede.
            </p>
          </div>
          <Button variant="outline" className="gap-2 hidden md:flex" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="indicacoes" className="w-full">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <TabsList className="bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="indicacoes" className="rounded-lg gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Minhas Indicações</span>
              <span className="sm:hidden">Indicações</span>
            </TabsTrigger>
            <TabsTrigger value="geral" className="rounded-lg gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Visão Geral</span>
              <span className="sm:hidden">Geral</span>
            </TabsTrigger>
            <TabsTrigger value="compartilhar" className="rounded-lg gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <GitBranch className="h-4 w-4" />
              Compartilhar
            </TabsTrigger>
          </TabsList>
        </motion.div>

        {/* ============ TAB: INDICAÇÕES ============ */}
        <TabsContent value="indicacoes" className="mt-6 space-y-6">
          {/* Search */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar indicado..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-border/50 rounded-xl"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 rounded-xl relative">
                  <Filter className="h-4 w-4" />
                  Filtros
                  {activeFilterCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4 space-y-4" align="start">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">Filtros</h4>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => { setFilterStatus(null); setFilterTipo(null); }}>
                      <X className="h-3 w-3" /> Limpar
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Ativo', 'Inativo', 'Pendente'].map(s => (
                      <Button
                        key={s}
                        variant={filterStatus === s ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 text-xs rounded-lg"
                        onClick={() => setFilterStatus(filterStatus === s ? null : s)}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Tipo</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Direta', 'Indireta'].map(t => (
                      <Button
                        key={t}
                        variant={filterTipo === t ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 text-xs rounded-lg"
                        onClick={() => setFilterTipo(filterTipo === t ? null : t)}
                      >
                        {t}
                      </Button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="sm" className="gap-2 rounded-xl md:hidden" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredMembros.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16 text-center">
                <UserPlus className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">Nenhum membro encontrado na rede.</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Compartilhe seu código de indicação para começar.</p>
              </CardContent>
            </Card>
          ) : (
            <UnifiedReferralTree
              diretasList={diretasList}
              indiretasList={indiretasList}
              onOpenDetail={handleOpenDetail}
            />
          )}

          {/* Pagination */}
          {filteredMembros.length > 0 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Mostrando 1-{filteredMembros.length} de {filteredMembros.length} resultados
              </p>
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" disabled className="h-8 rounded-lg text-xs">Anterior</Button>
                <button className="h-8 w-8 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">1</button>
                <Button variant="outline" size="sm" disabled className="h-8 rounded-lg text-xs">Próximo</Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ============ TAB: COMPARTILHAR ============ */}
        <TabsContent value="compartilhar" className="mt-6">
          <ReferralCard />
        </TabsContent>

        {/* ============ TAB: VISÃO GERAL ============ */}
        <TabsContent value="geral" className="mt-6">
          <NetworkOverviewTab diretasList={diretasList} indiretasList={indiretasList} comissaoPercent={comissaoPercent} onOpenDetail={handleOpenDetail} />
        </TabsContent>
      </Tabs>

      <MemberDetailModal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        membro={selectedMembro}
        onNavigateToMember={(membroId) => {
          const found = membrosRede.find(m => m.id === membroId);
          if (found) handleOpenDetail(found);
        }}
      />
    </div>
  );
}

/* ============================
   Unified Referral Tree Component
   ============================ */

import { AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/avatar';

interface UnifiedReferralTreeProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  diretasList: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  indiretasList: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onOpenDetail: (membro: any) => void;
}

function UnifiedReferralTree({ diretasList, indiretasList, onOpenDetail }: UnifiedReferralTreeProps) {
  const totalIndicados = diretasList.length + indiretasList.length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }}>
      <Card className="border-0 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <UserPlus className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Árvore de Indicações</h3>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary border-0 font-semibold">
            {totalIndicados} {totalIndicados === 1 ? 'indicado' : 'indicados'}
          </Badge>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="!w-10"></th>
                <th className="!text-center">NÍVEL</th>
                <th className="!text-left">NOME</th>
                <th className="!text-center">NÚMERO DE NEGÓCIOS</th>
                <th className="!text-center">VALOR</th>
                <th className="!text-center">ÚLTIMO NEGÓCIO</th>
                <th className="!text-center">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {diretasList.map((membro, i) => (
                <DirectReferralRow
                  key={membro.id}
                  membro={membro}
                  indiretas={i === 0 ? indiretasList : []}
                  index={i}
                  onOpenDetail={onOpenDetail}
                />
              ))}
              {diretasList.length === 0 && indiretasList.map((membro, i) => (
                <motion.tr
                  key={membro.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.35 + i * 0.05 }}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onOpenDetail(membro)}
                >
                  <td className="!w-10 !px-2 !text-center"><span className="inline-block w-4" /></td>
                  <td className="!text-center"><span className="text-muted-foreground">{membro.nivel}</span></td>
                  <td className="!text-left">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8 border-2 border-blue-500/20">
                        <AvatarImage src={membro.usuario?.avatar_url || undefined} />
                        <AvatarFallback className="bg-blue-500/10 text-blue-500 font-semibold text-xs">
                          {(membro.usuario?.nome || 'N').split(' ').filter(Boolean).slice(0, 2).map((p: string) => p[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">{membro.usuario?.nome || 'N/A'}</span>
                    </div>
                  </td>
                  <td><span className="text-muted-foreground">{membro.numero_negocios}</span></td>
                  <td><span className="font-medium text-foreground">{formatCurrency(membro.valor_total || 0)}</span></td>
                  <td><span className="text-muted-foreground">{membro.ultimo_negocio ? formatDate(membro.ultimo_negocio) : '—'}</span></td>
                  <td>
                    <span className={`status-badge ${membro.status === 'Ativo' ? 'active' : 'inactive'}`}>
                      {membro.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}

/* Direct referral row with expandable indirect children */
function DirectReferralRow({
  membro,
  indiretas,
  index,
  onOpenDetail,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  membro: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  indiretas: any[];
  index: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onOpenDetail: (m: any) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = indiretas.length > 0;

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.35 + index * 0.05 }}
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => onOpenDetail(membro)}
      >
        <td className="!w-10 !px-2 !text-center">
          {hasChildren ? (
            <button
              onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
              className="p-1 rounded hover:bg-muted/60 transition-colors inline-flex items-center justify-center"
            >
              <motion.span
                animate={{ rotate: isOpen ? 90 : 0 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                className="inline-flex"
              >
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </motion.span>
            </button>
          ) : (
            <span className="inline-block w-4" />
          )}
        </td>
        <td className="!text-center"><span className="text-muted-foreground">{membro.nivel}</span></td>
        <td className="!text-left">
          <div className="flex items-center gap-2.5">
            <Avatar className="h-8 w-8 border-2 border-primary/20">
              <AvatarImage src={membro.usuario?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary font-semibold text-xs">
                {(membro.usuario?.nome || 'N').split(' ').filter(Boolean).slice(0, 2).map((p: string) => p[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-foreground">{membro.usuario?.nome || 'N/A'}</span>
          </div>
        </td>
        <td><span className="text-muted-foreground">{membro.numero_negocios}</span></td>
        <td><span className="font-medium text-foreground">{formatCurrency(membro.valor_total || 0)}</span></td>
        <td><span className="text-muted-foreground">{membro.ultimo_negocio ? formatDate(membro.ultimo_negocio) : '—'}</span></td>
        <td>
          <span className={`status-badge ${membro.status === 'Ativo' ? 'active' : 'inactive'}`}>
            {membro.status}
          </span>
        </td>
      </motion.tr>

      {/* Indirect children */}
      <AnimatePresence>
        {isOpen && indiretas.map((ind, i) => (
          <motion.tr
            key={ind.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.35, delay: i * 0.04 }}
            className="bg-muted/10 hover:bg-muted/20 cursor-pointer transition-colors"
            onClick={() => onOpenDetail(ind)}
          >
            <td className="!w-10 !px-2 !text-center">
              <span className="inline-flex items-center justify-center text-muted-foreground/40 pl-2">
                <span className="border-l-2 border-b-2 border-muted-foreground/30 rounded-bl-md w-3 h-3 inline-block" />
              </span>
            </td>
            <td className="!text-center"><span className="text-muted-foreground">{ind.nivel}</span></td>
            <td className="!text-left">
              <div className="flex items-center gap-2.5 pl-4">
                <Avatar className="h-8 w-8 border-2 border-blue-500/20">
                  <AvatarImage src={ind.usuario?.avatar_url || undefined} />
                  <AvatarFallback className="bg-blue-500/10 text-blue-500 font-semibold text-xs">
                    {(ind.usuario?.nome || 'N').split(' ').filter(Boolean).slice(0, 2).map((p: string) => p[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground">{ind.usuario?.nome || 'N/A'}</span>
              </div>
            </td>
            <td><span className="text-muted-foreground">{ind.numero_negocios}</span></td>
            <td><span className="font-medium text-foreground">{formatCurrency(ind.valor_total || 0)}</span></td>
            <td><span className="text-muted-foreground">{ind.ultimo_negocio ? formatDate(ind.ultimo_negocio) : '—'}</span></td>
            <td>
              <span className={`status-badge ${ind.status === 'Ativo' ? 'active' : 'inactive'}`}>
                {ind.status}
              </span>
            </td>
          </motion.tr>
        ))}
      </AnimatePresence>
    </>
  );
}
