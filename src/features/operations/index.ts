/**
 * Operations Feature - Public API
 */

// Components
export { KanbanBoard } from './components/KanbanBoard';
export { KanbanCard } from './components/KanbanCard';
export { KanbanColumn } from './components/KanbanColumn';
export { OperationsFilters } from './components/OperationsFilters';
export { EditOperationModal } from './components/EditOperationModal';
export { DeleteOperationModal } from './components/DeleteOperationModal';
export { NewDealModal } from './components/NewDealModal';

// Pages
export { default as OperationsPage } from './pages/OperationsPage';
export { default as OperationDetailsPage } from './pages/OperationDetailsPage';

// API Hooks
export {
  useOperacoes,
  useOperacao,
  useOperacoesStats,
  useCreateOperacao,
  useUpdateOperacao,
  useDeleteOperacao,
  useMoveOperacao,
  useOperacaoHistorico,
} from './api/useOperacoes';

// Types
export type { EtapaPipeline } from '@/types/supabase';
