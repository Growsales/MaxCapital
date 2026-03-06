import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/dialog';
import { Badge } from '@/shared/components/badge';
import { Card, CardContent } from '@/shared/components/card';
import { Separator } from '@/shared/components/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/avatar';
import { motion } from 'framer-motion';
import {
  UserPlus,
  GitBranch,
  Mail,
  Phone,
  TrendingUp,
  DollarSign,
  Calendar,
  Hash,
  Activity,
  ArrowRight,
} from 'lucide-react';

interface MembroDetail {
  id: string;
  indicacao: string;
  nivel: string;
  numero_negocios: number;
  valor_total: number;
  ultimo_negocio: string | null;
  status: string;
  usuario?: {
    id: string;
    nome: string;
    email: string;
    telefone?: string | null;
    avatar_url?: string | null;
  };
  indiretas?: Array<{
    id: string;
    nivel: string;
    numero_negocios: number;
    valor_total: number;
    status: string;
    usuario?: { nome: string };
  }>;
  indicado_por?: { id?: string; nome: string; email?: string };
}

interface MemberDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  membro: MembroDetail | null;
  onNavigateToMember?: (membroId: string) => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('pt-BR');

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35 } }),
};

export default function MemberDetailModal({ open, onOpenChange, membro, onNavigateToMember }: MemberDetailModalProps) {
  if (!membro) return null;

  const isDireta = membro.indicacao === 'Direta';
  const initials = membro.usuario?.nome
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '??';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden border-border/50">
        {/* Header gradient band */}
        <div className={`h-2 bg-gradient-to-r ${isDireta ? 'from-emerald-500 via-emerald-400 to-emerald-300' : 'from-blue-500 via-blue-400 to-blue-300'}`} />

        <div className="p-6 space-y-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Detalhes do Indicado</DialogTitle>
          </DialogHeader>

          {/* Profile header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-4"
          >
            <Avatar className={`h-14 w-14 ring-2 ring-offset-2 ring-offset-background ${isDireta ? 'ring-primary/20' : 'ring-blue-500/20'}`}>
              <AvatarImage src={membro.usuario?.avatar_url || ''} />
              <AvatarFallback className={`font-bold text-lg ${isDireta ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-500'}`}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground text-base truncate">
                {membro.usuario?.nome || 'N/A'}
              </h3>
              {isDireta && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                  <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{membro.usuario?.email || 'N/A'}</span>
                </div>
              )}
            </div>
            <Badge
              variant="secondary"
              className={`border-0 font-semibold ${
                membro.status === 'Ativo'
                  ? 'bg-emerald-500/15 text-emerald-500'
                  : 'bg-destructive/15 text-destructive'
              }`}
            >
              <Activity className="h-3 w-3 mr-1" />
              {membro.status}
            </Badge>
          </motion.div>

          {/* Referrer info for indirect members */}
          {!isDireta && membro.indicado_por && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="flex items-center gap-3 bg-blue-500/8 border border-blue-500/15 rounded-xl p-3 cursor-pointer hover:bg-blue-500/10 hover:border-blue-500/25 transition-all"
              onClick={() => membro.indicado_por?.id && onNavigateToMember?.(membro.indicado_por.id)}
            >
              <div className="p-2 rounded-lg bg-blue-500/15">
                <UserPlus className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Indicado por</p>
                <p className="text-sm font-semibold text-foreground truncate">{membro.indicado_por.nome}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-blue-500/50" />
            </motion.div>
          )}

          {isDireta && (
            <>
              <Separator className="bg-border/50" />

              {/* Contact info */}
              <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
                <h4 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Informações de Contato</h4>
                <Card className="border-border/40 shadow-none">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/10 flex-shrink-0">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">E-mail</p>
                        <p className="text-sm font-semibold text-foreground truncate">{membro.usuario?.email || 'N/A'}</p>
                      </div>
                    </div>
                    {membro.usuario?.telefone && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-500/10 flex-shrink-0">
                          <Phone className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Telefone</p>
                          <a
                            href={`https://wa.me/${membro.usuario.telefone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-foreground truncate hover:text-emerald-500 transition-colors"
                          >
                            {membro.usuario.telefone}
                          </a>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}

          {!isDireta && (
            <>
              <Separator className="bg-border/50" />
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                className="flex items-center gap-3 bg-muted/40 border border-border/40 rounded-xl p-3"
              >
                <div className="p-2 rounded-lg bg-muted flex-shrink-0">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  As informações de contato deste indicado são restritas. Apenas indicações diretas possuem dados de contato visíveis.
                </p>
              </motion.div>
            </>
          )}

          {/* Indirect referrals */}
          {membro.indiretas && membro.indiretas.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <Separator className="bg-border/50 mb-5" />
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-1.5 rounded-lg bg-blue-500/10">
                  <GitBranch className="h-4 w-4 text-blue-500" />
                </div>
                <h4 className="font-bold text-foreground text-sm">
                  Indicações Indiretas
                </h4>
                <Badge variant="secondary" className="ml-auto bg-blue-500/10 text-blue-500 border-0 font-semibold text-xs">
                  {membro.indiretas.length}
                </Badge>
              </div>
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {membro.indiretas.map((ind, i) => (
                  <motion.div
                    key={ind.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.06, duration: 0.3 }}
                  >
                    <Card
                      className="border-border/40 shadow-none hover:border-primary/30 hover:bg-muted/30 transition-all cursor-pointer"
                      onClick={() => onNavigateToMember?.(ind.id)}
                    >
                      <CardContent className="p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{ind.usuario?.nome || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">
                            {ind.nivel} · {ind.numero_negocios} negócio{ind.numero_negocios !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <p className="text-sm font-bold text-foreground">{formatCurrency(ind.valor_total || 0)}</p>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] border-0 ${
                              ind.status === 'Ativo'
                                ? 'bg-emerald-500/15 text-emerald-500'
                                : 'bg-destructive/15 text-destructive'
                            }`}
                          >
                            {ind.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {isDireta && (!membro.indiretas || membro.indiretas.length === 0) && (
            <>
              <Separator className="bg-border/50" />
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground py-1">
                <GitBranch className="h-4 w-4" />
                <span>Este membro não possui indicações indiretas.</span>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
