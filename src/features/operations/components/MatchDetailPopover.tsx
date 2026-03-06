import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, ExternalLink, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/shared/components/badge';
import { Avatar, AvatarFallback } from '@/shared/components/avatar';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/shared/components/hover-card';
import { mockManifestacoes, mockProfiles, mockOportunidadesInvestimento } from '@/lib/mock-data';

const statusConfig: Record<string, { label: string; className: string }> = {
  interessado: { label: 'Interessado', className: 'bg-primary/10 text-primary border-primary/20' },
  pendente: { label: 'Pendente', className: 'bg-amber-500/10 text-amber-600 border-amber-200' },
  aprovada: { label: 'Aprovado', className: 'bg-primary/10 text-primary border-primary/20' },
  rejeitada: { label: 'Rejeitado', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
};

interface MatchDetailPopoverProps {
  operacaoId: string;
}

export function MatchDetailPopover({ operacaoId }: MatchDetailPopoverProps) {
  const navigate = useNavigate();
  const interessados = useMemo(() => {
    const oportunidade = mockOportunidadesInvestimento.find(
      (o) => o.operacao_origem_id === operacaoId
    );
    if (!oportunidade) return [];

    const manifestacoes = mockManifestacoes.filter(
      (m) => m.oportunidade_id === oportunidade.id
    );

    const investorMap: Record<string, { nome: string; email: string }> = {};
    mockProfiles.forEach((p) => {
      investorMap[p.id] = { nome: p.nome, email: p.email };
    });

    return manifestacoes.map((m) => {
      const investorId = (m as any).investidor_id || (m as any).usuario_id;
      const investor = investorMap[investorId] || { nome: 'Investidor', email: '' };
      return {
        id: m.id,
        nome: investor.nome,
        valor: (m as any).valor || 0,
        status: (m as any).status || 'interessado',
        created_at: m.created_at,
      };
    });
  }, [operacaoId]);

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  const handleOpenMatch = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigate(`/operacoes/${operacaoId}?tab=match`);
  };

  return (
    <HoverCard openDelay={400} closeDelay={300}>
      <HoverCardTrigger asChild>
        <span
          className="relative z-10 inline-flex h-6 w-6 items-center justify-center rounded-md shrink-0 cursor-pointer hover:bg-muted transition-colors"
          onClick={handleOpenMatch}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Flame className="h-3.5 w-3.5 text-destructive" />
        </span>
      </HoverCardTrigger>
      <HoverCardContent
        className="w-80 p-0 z-50"
        align="start"
        side="bottom"
        sideOffset={8}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Users className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">
            Interessados ({interessados.length})
          </h4>
        </div>

        {interessados.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-muted-foreground">
            Nenhum investidor interessado ainda.
          </p>
        ) : (
          <div className="max-h-64 overflow-y-auto divide-y divide-border">
            {interessados.map((inv) => {
              const sc = statusConfig[inv.status] || statusConfig.pendente;
              return (
                <div key={inv.id} className="flex items-center gap-2.5 px-4 py-2.5">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {getInitials(inv.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{inv.nome}</p>
                    {inv.valor > 0 && (
                      <p className="text-[10px] text-muted-foreground">{formatCurrency(inv.valor)}</p>
                    )}
                  </div>
                  <Badge variant="outline" className={cn('text-[10px] border shrink-0', sc.className)}>
                    {sc.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={handleOpenMatch}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex w-full items-center justify-center gap-1.5 border-t border-border px-4 py-2.5 text-xs font-medium text-primary hover:bg-muted/50 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          Ver detalhes completos
        </button>
      </HoverCardContent>
    </HoverCard>
  );
}
