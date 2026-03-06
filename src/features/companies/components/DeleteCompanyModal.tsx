import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { GenericModal, DeleteConfirmationContent } from '@/lib/design-system';
import { useDeleteEmpresa } from '@/features/companies/api/useEmpresas';
import { useToast } from '@/shared/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/supabase';

type Empresa = Tables<'empresas'>;

interface DeleteCompanyModalProps {
  open: boolean;
  onClose: () => void;
  empresa: Empresa | null;
}

interface LinkedOperation {
  id: string;
  numero_funil: string;
  etapa_atual: string;
}

export function DeleteCompanyModal({ open, onClose, empresa }: DeleteCompanyModalProps) {
  const deleteEmpresa = useDeleteEmpresa();
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);
  const [linkedOperations, setLinkedOperations] = useState<LinkedOperation[]>([]);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (open && empresa) {
      checkLinkedOperations();
    } else {
      setLinkedOperations([]);
      setHasChecked(false);
    }
  }, [open, empresa]);

  const checkLinkedOperations = async () => {
    if (!empresa) return;

    setIsChecking(true);
    try {
      const { data, error } = await supabase
        .from('operacoes')
        .select('id, numero_funil, etapa_atual')
        .eq('empresa_id', empresa.id);

      if (error) throw error;
      setLinkedOperations(data || []);
      setHasChecked(true);
    } catch (error) {
      console.error('Erro ao verificar operações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível verificar operações vinculadas.',
        variant: 'destructive',
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleDelete = async () => {
    if (!empresa) return;

    try {
      await deleteEmpresa.mutateAsync(empresa.id);
      toast({
        title: 'Empresa excluída',
        description: 'A empresa foi removida com sucesso.',
      });
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir',
        description: error?.message || 'Não foi possível excluir a empresa.',
        variant: 'destructive',
      });
    }
  };

  const canDelete = hasChecked && linkedOperations.length === 0;

  return (
    <GenericModal
      open={open}
      onClose={onClose}
      onConfirm={handleDelete}
      title="Excluir Empresa"
      description="Esta ação não pode ser desfeita."
      icon={Trash2}
      variant="destructive"
      confirmLabel="Excluir"
      cancelLabel={canDelete ? 'Cancelar' : 'Fechar'}
      showConfirmButton={canDelete}
      isLoading={deleteEmpresa.isPending || isChecking}
      isDisabled={!canDelete}
    >
      <div className="space-y-4">
        {/* Company Info */}
        <DeleteConfirmationContent
          itemName={empresa?.nome || ''}
          itemDescription={empresa?.cnpj}
        />

        {/* Checking status */}
        {isChecking && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="h-4 w-4 animate-spin border-2 border-current border-r-transparent rounded-full" />
            <span className="text-sm">Verificando operações vinculadas...</span>
          </div>
        )}

        {/* Linked operations warning */}
        {hasChecked && linkedOperations.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
            <div className="flex items-start gap-2">
              <div className="text-sm">
                <p className="font-medium text-red-900">
                  Não é possível excluir esta empresa
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Existem {linkedOperations.length} operação(ões) vinculada(s) a esta empresa.
                  Remova as operações primeiro para poder excluir a empresa.
                </p>
              </div>
            </div>

            <div className="max-h-32 overflow-y-auto space-y-2">
              {linkedOperations.map((op) => (
                <div
                  key={op.id}
                  className="flex items-center justify-between p-2 bg-white rounded text-sm border border-red-100"
                >
                  <span className="font-medium text-red-900">{op.numero_funil}</span>
                  <span className="text-red-700">{op.etapa_atual}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </GenericModal>
  );
}
