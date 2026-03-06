import { forwardRef, useState } from 'react';
import { UserPlus, GitBranch, TrendingUp, DollarSign, Calendar, Loader2, AlertCircle, BarChart3, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMinhasIndicacoes, Indicacao } from '@/features/network/api/useIndicacoes';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/avatar';
import { Badge } from '@/shared/components/badge';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/alert';
import { Card, CardContent } from '@/shared/components/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('pt-BR');
}

/* ── Expandable direct referral row with nested indirects ── */
function ReferralTreeRow({
  direta,
  indiretas,
  index,
}: {
  direta: Indicacao;
  indiretas: Indicacao[];
  index: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = indiretas.length > 0;

  return (
    <>
      {/* Direct referral row */}
      <motion.tr
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
        onClick={() => hasChildren && setIsOpen(!isOpen)}
      >
        <TableCell className="text-center">
          {hasChildren ? (
            <motion.span
              animate={{ rotate: isOpen ? 90 : 0 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="inline-flex"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </motion.span>
          ) : (
            <span className="inline-block w-4" />
          )}
        </TableCell>
        <TableCell className="text-center">
          <Badge className="bg-primary/20 text-primary border-0 text-xs">Nível 1</Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 border-2 border-primary/20">
              <AvatarImage src={direta.indicado?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary font-semibold text-xs">
                {direta.indicado?.nome
                  ? direta.indicado.nome.split(' ').map(n => n.charAt(0).toUpperCase()).slice(0, 2).join('')
                  : 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold text-foreground">{direta.indicado?.nome || 'Usuário'}</span>
          </div>
        </TableCell>
        <TableCell className="text-center">{direta.total_operacoes || 0}</TableCell>
        <TableCell className="text-center font-semibold text-emerald-500">
          {formatCurrency(direta.valor_gerado || 0)}
        </TableCell>
        <TableCell className="text-center text-muted-foreground">
          {formatDate(direta.indicado?.created_at || direta.data_indicacao)}
        </TableCell>
        <TableCell className="text-center">
          <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">Ativo</Badge>
        </TableCell>
      </motion.tr>

      {/* Indirect referral children (tree nodes) */}
      <AnimatePresence>
        {isOpen &&
          indiretas.map((indireta, i) => (
            <motion.tr
              key={indireta.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.35, delay: i * 0.04 }}
              className="border-b border-border/30 bg-muted/10 hover:bg-muted/20 transition-colors"
            >
              <TableCell className="text-center">
                {/* Tree connector line */}
                <span className="inline-flex items-center justify-center text-muted-foreground/40">
                  <span className="border-l-2 border-b-2 border-muted-foreground/30 rounded-bl-md w-3 h-3 inline-block" />
                </span>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary" className="text-xs">Nível 2</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3 pl-4">
                  <Avatar className="h-8 w-8 border-2 border-blue-500/20">
                    <AvatarImage src={indireta.indicado?.avatar_url || undefined} />
                    <AvatarFallback className="bg-blue-500/10 text-blue-500 font-semibold text-xs">
                      {indireta.indicado?.nome
                        ? indireta.indicado.nome.split(' ').map(n => n.charAt(0).toUpperCase()).slice(0, 2).join('')
                        : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-foreground">{indireta.indicado?.nome || 'Usuário'}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">{indireta.total_operacoes || 0}</TableCell>
              <TableCell className="text-center font-semibold text-emerald-500">
                {formatCurrency(indireta.valor_gerado || 0)}
              </TableCell>
              <TableCell className="text-center text-muted-foreground">
                {formatDate(indireta.indicado?.created_at || indireta.data_indicacao)}
              </TableCell>
              <TableCell className="text-center">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">Ativo</Badge>
              </TableCell>
            </motion.tr>
          ))}
      </AnimatePresence>
    </>
  );
}

/* ── Stat cards config ── */
const statCards = [
  { key: 'diretas', label: 'Indicações Diretas', border: 'border-l-primary', iconBg: 'bg-primary/10', iconColor: 'text-primary', icon: UserPlus, badgeLabel: 'Nível 1', badgeClass: 'bg-primary/20 text-primary border-0 text-xs' },
  { key: 'indiretas', label: 'Indicações Indiretas', border: 'border-l-blue-500', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-500', icon: GitBranch, badgeLabel: 'Nível 2', badgeClass: 'bg-blue-500/10 text-blue-500 border-0 text-xs' },
  { key: 'operacoes', label: 'Total de Operações', border: 'border-l-amber-500', iconBg: 'bg-amber-500/10', iconColor: 'text-amber-500', icon: BarChart3 },
  { key: 'valor', label: 'Valor Total Gerado', border: 'border-l-emerald-500', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-500', icon: DollarSign },
];

const ReferralTree = forwardRef<HTMLDivElement>((_, ref) => {
  const { data, isLoading, error } = useMinhasIndicacoes();

  const indicacoes = data?.indicacoes || [];
  const stats = data?.stats;

  const indicacoesDiretas = indicacoes.filter(i => i.nivel_indicacao === 1);
  const indicacoesIndiretas = indicacoes.filter(i => i.nivel_indicacao === 2);

  // Group indirects by their parent (indicacao_pai_id)
  const indirectsByParent = indicacoesIndiretas.reduce<Record<string, Indicacao[]>>((acc, ind) => {
    const parentId = ind.indicacao_pai_id || '_unlinked';
    if (!acc[parentId]) acc[parentId] = [];
    acc[parentId].push(ind);
    return acc;
  }, {});

  const needsDbSetup = error && (
    String(error).includes('indicacoes') ||
    String(error).includes('PGRST')
  );

  const statValues: Record<string, string | number> = {
    diretas: stats?.totalDiretas || 0,
    indiretas: stats?.totalIndiretas || 0,
    operacoes: stats?.operacoesTotais || 0,
    valor: formatCurrency(stats?.valorTotalGerado || 0),
  };

  const totalIndicados = indicacoes.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div ref={ref} className="space-y-6">
      {needsDbSetup && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuração do Banco de Dados Necessária</AlertTitle>
          <AlertDescription>
            A tabela de indicações ainda não foi criada no Supabase.
            Execute as migrations SQL para habilitar o sistema de indicações.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <Card className={`border-0 border-l-4 ${stat.border} shadow-sm`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${stat.iconBg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">{stat.label}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-foreground">{statValues[stat.key]}</span>
                      {stat.badgeLabel && (
                        <Badge className={stat.badgeClass}>{stat.badgeLabel}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {indicacoes.length === 0 && !needsDbSetup ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <UserPlus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Nenhuma indicação ainda</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Compartilhe seu código de convite e comece a construir sua rede de indicações.
                Você pode ganhar comissões sobre operações realizadas pelos seus indicados!
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : !needsDbSetup && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                    <UserPlus className="h-4 w-4" />
                  </div>
                  <h3 className="font-semibold text-foreground">Árvore de Indicações</h3>
                </div>
                <Badge className="bg-primary/20 text-primary border-0">
                  {totalIndicados} {totalIndicados === 1 ? 'indicado' : 'indicados'}
                </Badge>
              </div>

              {/* Unified Tree Table */}
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="w-[40px]" />
                    <TableHead className="w-[90px] text-center">Nível</TableHead>
                    <TableHead className="text-left">Nome</TableHead>
                    <TableHead className="w-[160px] text-center">Número de Negócios</TableHead>
                    <TableHead className="w-[160px] text-center">Valor</TableHead>
                    <TableHead className="w-[140px] text-center">Último Negócio</TableHead>
                    <TableHead className="w-[90px] text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {indicacoesDiretas.map((direta, i) => (
                    <ReferralTreeRow
                      key={direta.id}
                      direta={direta}
                      indiretas={indirectsByParent[direta.id] || []}
                      index={i}
                    />
                  ))}

                  {/* Unlinked indirect referrals (no parent match) */}
                  {(indirectsByParent['_unlinked'] || []).map((ind, i) => (
                    <motion.tr
                      key={ind.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: (indicacoesDiretas.length + i) * 0.05 }}
                      className="border-b border-border/30 bg-muted/10 hover:bg-muted/20 transition-colors"
                    >
                      <TableCell className="text-center">
                        <span className="inline-block w-4" />
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-xs">Nível 2</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border-2 border-blue-500/20">
                            <AvatarImage src={ind.indicado?.avatar_url || undefined} />
                            <AvatarFallback className="bg-blue-500/10 text-blue-500 font-semibold text-xs">
                              {ind.indicado?.nome
                                ? ind.indicado.nome.split(' ').map(n => n.charAt(0).toUpperCase()).slice(0, 2).join('')
                                : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-foreground">{ind.indicado?.nome || 'Usuário'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{ind.total_operacoes || 0}</TableCell>
                      <TableCell className="text-center font-semibold text-emerald-500">
                        {formatCurrency(ind.valor_gerado || 0)}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {formatDate(ind.indicado?.created_at || ind.data_indicacao)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">Ativo</Badge>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
});

ReferralTree.displayName = 'ReferralTree';

export default ReferralTree;
