import { useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { Loader2, Lock } from 'lucide-react';
import { useOperacoes, useMoveOperacao } from '../api/useOperacoes';
import { isOperacaoDraft } from '@/features/operations/pages/OperationsPage';
import { useOportunidadesOrigemIds } from '@/hooks/useOportunidadesInvestimento';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { EtapaPipeline, UserType } from '@/types/supabase';
import { toast } from '@/shared/hooks/use-toast';
import { useAuth } from '@/shared/hooks/useAuth';
import { canMoveOperationKanban } from '@/lib/permissions';
import type { FilterValues } from './OperationsFilters';

// All pipeline stages (ordered)
const allPipelineStages: EtapaPipeline[] = [
  'Prospecto',
  'Comitê',
  'Comercial',
  'Cliente Ativo',
  'Estruturação',
  'Matchmaking',
  'Apresentação',
  'Negociação',
  'Concluído',
];

// Minimum stage index for opportunities (Matchmaking onwards, no going back)
const MATCHMAKING_INDEX = allPipelineStages.indexOf('Matchmaking');

// Stages visible for investors (from Matchmaking onwards)
const investorPipelineStages: EtapaPipeline[] = [
  'Estruturação',
  'Matchmaking',
  'Apresentação',
  'Negociação',
  'Concluído',
];

interface KanbanBoardProps {
  searchQuery?: string;
  filters?: FilterValues;
  userId?: string; // Filter by logged-in user
}

export function KanbanBoard({ searchQuery, filters, userId }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const { profile } = useAuth();
  const { isAdmin: hasAdminAccess, isMaster } = useAdminPermissions();
  const userType = profile?.tipo as UserType | undefined;
  const isAdmin = hasAdminAccess || isMaster || userType === 'admin' || userType === 'master';
  const canDrag = isAdmin || canMoveOperationKanban(userType);
  
  // Investors see only Matchmaking onwards
  const isInvestor = userType === 'investidor';
  const pipelineStages = isInvestor ? investorPipelineStages : allPipelineStages;
  
  const { data: allOperacoes = [], isLoading } = useOperacoes({ searchQuery, userId });
  const origemIds = useOportunidadesOrigemIds();
  const moveOperacao = useMoveOperacao();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: canDrag ? 8 : Infinity, // Disable drag if user can't move
      },
    })
  );

  // Apply filters and group operations by stage
  const operacoesByStage = useMemo(() => {
    let filtered = allOperacoes;
    
    // Apply filters
    if (filters?.responsavel) {
      filtered = filtered.filter(op => op.responsavel_id === filters.responsavel);
    }
    if (filters?.segmento && filters.segmento !== 'Todos') {
      filtered = filtered.filter(op => 
        op.segmento === filters.segmento || op.empresa?.segmento === filters.segmento
      );
    }
    if (filters?.valorMin !== undefined) {
      filtered = filtered.filter(op => (op.valor_investimento || 0) >= filters.valorMin!);
    }
    if (filters?.valorMax !== undefined) {
      filtered = filtered.filter(op => (op.valor_investimento || 0) <= filters.valorMax!);
    }
    if (filters?.dataInicio) {
      filtered = filtered.filter(op => 
        op.created_at && new Date(op.created_at) >= filters.dataInicio!
      );
    }
    if (filters?.dataFim) {
      filtered = filtered.filter(op => 
        op.created_at && new Date(op.created_at) <= filters.dataFim!
      );
    }

    const grouped: Record<EtapaPipeline, typeof allOperacoes> = {
      'Prospecto': [],
      'Comitê': [],
      'Comercial': [],
      'Cliente Ativo': [],
      'Estruturação': [],
      'Matchmaking': [],
      'Apresentação': [],
      'Negociação': [],
      'Concluído': [],
    };

    filtered.forEach(op => {
      if (op.etapa_atual && grouped[op.etapa_atual as EtapaPipeline]) {
        grouped[op.etapa_atual as EtapaPipeline].push(op);
      }
    });

    return grouped;
  }, [allOperacoes, filters]);

  const activeOperacao = useMemo(() => {
    if (!activeId) return null;
    return allOperacoes.find(op => op.id === activeId) || null;
  }, [activeId, allOperacoes]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const operacaoId = active.id as string;
    const targetStage = over.id as EtapaPipeline;

    // Find the operation
    const operacao = allOperacoes.find(op => op.id === operacaoId);
    if (!operacao) return;

    // Only move if dropping on a different stage
    if (operacao.etapa_atual !== targetStage) {
      // Draft operations cannot be moved
      if (isOperacaoDraft(operacao)) {
        toast({
          title: 'Operação incompleta',
          description: 'Complete o formulário antes de avançar esta operação.',
          variant: 'destructive',
        });
        return;
      }
      const isOportunidade = origemIds.has(operacaoId);
      const targetIndex = allPipelineStages.indexOf(targetStage);
      const currentIndex = allPipelineStages.indexOf(operacao.etapa_atual as EtapaPipeline);

      // Opportunities cannot go before Matchmaking
      if (isOportunidade && targetIndex < MATCHMAKING_INDEX) {
        toast({
          title: 'Movimento não permitido',
          description: 'Oportunidades não podem retornar para etapas anteriores a Matchmaking.',
          variant: 'destructive',
        });
        return;
      }

      // Opportunities cannot go backwards
      if (isOportunidade && targetIndex < currentIndex) {
        toast({
          title: 'Movimento não permitido',
          description: 'Oportunidades não podem voltar para etapas anteriores.',
          variant: 'destructive',
        });
        return;
      }

      moveOperacao.mutate(
        {
          operacaoId,
          novaEtapa: targetStage,
          observacoes: `Movido de ${operacao.etapa_atual} para ${targetStage}`,
        },
        {
          onSuccess: () => {
            toast({
              title: 'Operação movida',
              description: `${operacao.empresa?.nome || operacao.numero_funil} movido para ${targetStage}`,
            });
          },
          onError: (error) => {
            toast({
              title: 'Erro ao mover operação',
              description: error.message,
              variant: 'destructive',
            });
          },
        }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {pipelineStages.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            operacoes={operacoesByStage[stage]}
            oportunidadeIds={origemIds}
          />
        ))}
      </div>

      <DragOverlay>
        {activeOperacao && (
          <div className="rotate-3 opacity-90">
            <KanbanCard id={activeOperacao.id} operacao={activeOperacao} isOportunidade={origemIds.has(activeOperacao.id)} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
