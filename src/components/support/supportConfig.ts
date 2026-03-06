import {
  HelpCircle, Bug, FileText, AlertCircle, CircleDollarSign,
  Lightbulb, MoreHorizontal,
} from 'lucide-react';
import type { CategoriaChamado, StatusChamado } from '@/hooks/useChamados';

// ============================================================
// Support Config — Shared constants extracted from SupportModal
// Used by: SupportTicketList, SupportTicketDetail, SupportNewTicketForm
// ============================================================

export const categoriaConfig: Record<CategoriaChamado, {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}> = {
  duvida: { label: 'Dúvida', icon: HelpCircle, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  problema_tecnico: { label: 'Problema Técnico', icon: Bug, color: 'text-red-500', bg: 'bg-red-500/10' },
  solicitacao_cadastro: { label: 'Solicitação de Cadastro', icon: FileText, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  erro_sistema: { label: 'Erro no Sistema', icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  duvida_financeira: { label: 'Dúvida Financeira', icon: CircleDollarSign, color: 'text-green-500', bg: 'bg-green-500/10' },
  sugestao: { label: 'Sugestão', icon: Lightbulb, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  outros: { label: 'Outros', icon: MoreHorizontal, color: 'text-gray-500', bg: 'bg-gray-500/10' },
};

export const statusConfig: Record<StatusChamado, {
  label: string;
  color: string;
  textColor: string;
  bg: string;
}> = {
  aberto: { label: 'Aberto', color: 'bg-yellow-500', textColor: 'text-yellow-600', bg: 'bg-yellow-500/10' },
  em_andamento: { label: 'Em Andamento', color: 'bg-blue-500', textColor: 'text-blue-600', bg: 'bg-blue-500/10' },
  aguardando_usuario: { label: 'Aguardando Usuário', color: 'bg-orange-500', textColor: 'text-orange-600', bg: 'bg-orange-500/10' },
  resolvido: { label: 'Resolvido', color: 'bg-green-500', textColor: 'text-green-600', bg: 'bg-green-500/10' },
  fechado: { label: 'Fechado', color: 'bg-gray-500', textColor: 'text-gray-600', bg: 'bg-gray-500/10' },
};

/** Scrollbar styles shared across support sub-components */
export const scrollbarStyles = {
  scrollbarWidth: 'thin' as const,
  scrollbarColor: 'hsl(var(--muted-foreground) / 0.3) transparent',
};
