import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { KanbanCard } from './KanbanCard';
import { EtapaPipeline } from '@/types/supabase';

interface OperacaoItem {
  id: string;
  numero_funil: string;
  valor_investimento?: number | null;
  lead_tag?: string | null;
  dias_na_etapa?: number | null;
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
}

interface KanbanColumnProps {
  stage: EtapaPipeline;
  operacoes: OperacaoItem[];
  color?: string;
  oportunidadeIds?: Set<string>;
}

const stageDotColors: Record<EtapaPipeline, string> = {
  'Prospecto': 'bg-blue-500',
  'Comitê': 'bg-violet-500',
  'Comercial': 'bg-amber-500',
  'Cliente Ativo': 'bg-emerald-500',
  'Matchmaking': 'bg-pink-500',
  'Estruturação': 'bg-orange-500',
  'Apresentação': 'bg-teal-500',
  'Negociação': 'bg-red-500',
  'Concluído': 'bg-emerald-600',
};

const formatTotal = (value: number) => {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
  return `R$ ${value}`;
};

export function KanbanColumn({ stage, operacoes, oportunidadeIds }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  const totalValue = operacoes.reduce((acc, op) => acc + (op.valor_investimento || 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-w-[280px] max-w-[280px] rounded-xl p-3 transition-all duration-200',
        'bg-muted/50 border-2',
        isOver ? 'border-primary/50 border-dashed bg-primary/5' : 'border-transparent',
      )}
    >
      {/* Column Header */}
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className={cn('h-3 w-3 rounded', stageDotColors[stage])} />
          <h2 className="text-sm font-semibold text-foreground">{stage}</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {operacoes.length}
          </span>
        </div>
      </div>

      {totalValue > 0 && (
        <p className="text-xs text-muted-foreground px-1 mb-3">
          Total: <span className="font-medium text-foreground">{formatTotal(totalValue)}</span>
        </p>
      )}

      {/* Tasks */}
      <div className="flex min-h-[100px] flex-col gap-2 max-h-[calc(100vh-320px)] overflow-y-auto">
        <SortableContext
          items={operacoes.map(op => op.id)}
          strategy={verticalListSortingStrategy}
        >
          {operacoes.map((operacao) => (
            <KanbanCard key={operacao.id} id={operacao.id} operacao={operacao} isOportunidade={oportunidadeIds?.has(operacao.id)} />
          ))}
        </SortableContext>

        {operacoes.length === 0 && (
          <div className="flex items-center justify-center h-24 rounded-lg border-2 border-dashed border-border/50 text-xs text-muted-foreground">
            Arraste operações aqui
          </div>
        )}
      </div>
    </div>
  );
}
