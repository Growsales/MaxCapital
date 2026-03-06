import { Trash2 } from 'lucide-react';
import { GenericModal, DeleteConfirmationContent, ConfirmationContent } from '@/lib/design-system';
import { useDeleteOperacao } from '@/features/operations/api/useOperacoes';
import { useToast } from '@/shared/hooks/use-toast';
import type { Tables } from '@/types/supabase';

type Operacao = Tables<'operacoes'>;

interface OperacaoWithRelations extends Operacao {
  empresa?: {
    id: string;
    nome: string;
    cnpj?: string;
  };
}

interface DeleteOperationModalProps {
  open: boolean;
  onClose: () => void;
  operacao: OperacaoWithRelations | null;
  onSuccess?: () => void;
}

export function DeleteOperationModal({
  open,
  onClose,
  operacao,
  onSuccess
}: DeleteOperationModalProps) {
  const deleteOperacao = useDeleteOperacao();
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!operacao) return;

    try {
      await deleteOperacao.mutateAsync(operacao.id);
      toast({
        title: 'Operação excluída',
        description: 'A operação foi removida com sucesso.',
      });
      onClose();
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir',
        description: error?.message || 'Não foi possível excluir a operação.',
        variant: 'destructive',
      });
    }
  };

  return (
    <GenericModal
      open={open}
      onClose={onClose}
      onConfirm={handleDelete}
      title="Excluir Operação"
      description="Esta ação não pode ser desfeita."
      icon={Trash2}
      variant="destructive"
      confirmLabel="Excluir"
      isLoading={deleteOperacao.isPending}
    >
      <div className="space-y-4">
        <DeleteConfirmationContent
          itemName={operacao?.numero_funil || ''}
          itemDescription={operacao?.empresa?.nome || 'Sem empresa vinculada'}
        />

        {/* Operation Details */}
        <div className="text-sm space-y-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p>
            <span className="font-medium text-red-900">Etapa atual:</span>{' '}
            <span className="text-red-700">{operacao?.etapa_atual || '-'}</span>
          </p>
          <p>
            <span className="font-medium text-red-900">Valor:</span>{' '}
            <span className="text-red-700">
              {operacao?.valor_investimento
                ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    operacao.valor_investimento
                  )
                : '-'}
            </span>
          </p>
        </div>

        <ConfirmationContent
          message="A operação será permanentemente removida, incluindo todo o histórico de movimentações."
          emphasize={true}
        />
      </div>
    </GenericModal>
  );
}
