import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Building2, Calendar, Zap, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { isOperacaoDraft, resumeDraftOperation } from '@/features/operations/pages/OperationsPage';

interface KanbanCardProps {
  id: string;
  operacao: {
    id: string;
    numero_funil: string;
    valor_investimento?: number | null;
    lead_tag?: string | null;
    dias_na_etapa?: number | null;
    observacoes?: string | null;
    empresa?: {
      id: string;
      nome: string;
      segmento?: string | null;
    } | null;
    responsavel?: {
      id: string;
      nome: string;
      avatar_url?: string | null;
    } | null;
  };
  isOportunidade?: boolean;
}

const leadTagColors: Record<string, string> = {
  frio: 'bg-blue-500',
  morno: 'bg-amber-500',
  quente: 'bg-orange-500',
  convertido: 'bg-emerald-500',
};

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
};

export function KanbanCard({ id, operacao, isOportunidade }: KanbanCardProps) {
  const isDraft = isOperacaoDraft(operacao);
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging) {
      if (isDraft) {
        resumeDraftOperation(operacao, (path) => navigate(path));
      } else {
        navigate(`/operacoes/${operacao.id}`);
      }
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={cn(
        'cursor-grab rounded-lg border p-3 shadow-sm transition-all duration-150',
        'hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing',
        isDragging && 'rotate-2 opacity-50 shadow-lg',
        isOportunidade
          ? 'border-primary/20 bg-card ring-1 ring-primary/10'
          : 'border-border bg-card',
      )}
    >
      {/* Labels */}
      <div className="mb-2 flex flex-wrap gap-1">
        {isDraft && (
          <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-500 bg-amber-500/15 border border-amber-500/20 flex items-center gap-0.5">
            <AlertCircle className="h-2.5 w-2.5" />
            Incompleto
          </span>
        )}
        {isOportunidade && (
          <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary-foreground bg-primary flex items-center gap-0.5">
            <Zap className="h-2.5 w-2.5" />
            Oportunidade
          </span>
        )}
        {operacao.lead_tag && !isOportunidade && !isDraft && (
          <span
            className={cn(
              'rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white',
              leadTagColors[operacao.lead_tag] || 'bg-slate-500',
            )}
          >
            {operacao.lead_tag}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-sm font-medium text-card-foreground mb-1">
        {operacao.empresa?.nome || 'Sem empresa'}
      </h3>
      <p className="mb-2 text-xs text-muted-foreground">{operacao.numero_funil}</p>

      {operacao.empresa?.segmento && (
        <p className="text-xs text-muted-foreground mb-2 truncate">
          {operacao.empresa.segmento}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        {operacao.valor_investimento ? (
          <span className="text-sm font-semibold text-primary">
            {formatCurrency(operacao.valor_investimento)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}

        <div className="flex items-center gap-2">

          {operacao.dias_na_etapa != null && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {operacao.dias_na_etapa}d
            </span>
          )}

          {operacao.responsavel?.avatar_url ? (
            <img
              src={operacao.responsavel.avatar_url}
              alt={operacao.responsavel.nome}
              className="h-7 w-7 rounded-full object-cover"
            />
          ) : operacao.responsavel?.nome ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
              {operacao.responsavel.nome.charAt(0).toUpperCase()}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
