import { motion } from 'framer-motion';
import {
  CheckCircle2, MessageSquare, Plus, ChevronRight, User,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { categoriaConfig, statusConfig } from './supportConfig';
import type { Chamado } from '@/hooks/useChamados';

interface SupportTicketListProps {
  chamados: Chamado[] | undefined;
  isLoading: boolean;
  isAdmin: boolean;
  onSelectChamado: (chamado: Chamado) => void;
  onOpenNewTicket: () => void;
}

export function SupportTicketList({
  chamados,
  isLoading,
  isAdmin,
  onSelectChamado,
  onOpenNewTicket,
}: SupportTicketListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted/30 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!chamados || chamados.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-14 w-14 rounded-full bg-muted/30 flex items-center justify-center mb-3">
          <CheckCircle2 className="h-7 w-7 text-muted-foreground/40" />
        </div>
        <h3 className="font-medium text-sm mb-1">
          {isAdmin ? 'Nenhum chamado encontrado' : 'Nenhum chamado'}
        </h3>
        <p className="text-xs text-muted-foreground mb-4 max-w-[220px]">
          {isAdmin
            ? 'Não há chamados com os filtros selecionados'
            : 'Você ainda não possui chamados de suporte'
          }
        </p>
        {!isAdmin && (
          <Button size="sm" onClick={onOpenNewTicket} className="gap-1.5 h-8 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Abrir Chamado
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 p-1">
      {chamados.map((chamado, index) => {
        const CatIcon = categoriaConfig[chamado.categoria]?.icon || MessageSquare;
        const catConfig = categoriaConfig[chamado.categoria];
        const stConfig = statusConfig[chamado.status];
        return (
          <motion.div
            key={chamado.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.25 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelectChamado(chamado)}
            className={cn(
              'group relative pl-4 pr-3 py-3 rounded-xl border border-border/30 bg-card cursor-pointer',
              'transition-all duration-150 hover:bg-accent/30 hover:border-border/60'
            )}
          >
            {/* Left accent bar */}
            <div className={cn('absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full', stConfig.color)} />

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className={cn('p-1.5 rounded-lg flex-shrink-0', catConfig?.bg)}>
                  <CatIcon className={cn('h-4 w-4', catConfig?.color)} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground/50">
                      {chamado.numero_chamado}
                    </span>
                  </div>
                  <h4 className="font-medium text-[13px] leading-tight line-clamp-1">
                    {chamado.assunto}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    {isAdmin && chamado.usuario && (
                      <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1">
                        <User className="h-2.5 w-2.5" />
                        {chamado.usuario.nome}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground/40">
                      {format(new Date(chamado.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge className={cn(
                  'text-white text-[10px] font-medium px-2 py-0 rounded-full',
                  stConfig.color
                )}>
                  {stConfig.label}
                </Badge>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/25 group-hover:text-muted-foreground/60 transition-colors" />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
