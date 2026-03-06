import { FieldValues } from 'react-hook-form';
import { GenericModal, FormModalContent } from '@/lib/design-system';
import { FormWizard } from '@/components/forms/FormWizard';
import { OPERACAO_FORM_CONFIG } from '@/lib/forms/schemas/operacao.schema';
import { FormConfig } from '@/lib/forms/types';

interface NewDealModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Configuração de operação customizada para o modal
 * Herda de OPERACAO_FORM_CONFIG com ajustes para o contexto do modal
 */
const getFormConfig = (onClose: () => void): FormConfig => {
  const config: FormConfig = {
    ...OPERACAO_FORM_CONFIG,
    id: 'operacao-modal',
    title: 'Nova Operação de Investimento',
    submitLabel: 'Enviar para Análise',
    onSubmit: async (data: FieldValues) => {
      // TODO: Implementar submissão de operação
      console.log('Submit operacao:', data);
      onClose();
    },
  };

  return config;
};

export function NewDealModal({ open, onClose }: NewDealModalProps) {
  const formConfig = getFormConfig(onClose);

  return (
    <GenericModal
      open={open}
      onClose={onClose}
      title="Novo Negócio"
      description="Preencha os dados da oportunidade de investimento"
      variant="default"
      showConfirmButton={false}
      showCancelButton={false}
      size="lg"
    >
      <FormModalContent>
        <FormWizard config={formConfig} onCancel={onClose} />
      </FormModalContent>
    </GenericModal>
  );
}
