import { FieldValues } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/dialog';
import { FormWizard } from '@/components/forms/FormWizard';
import { EMPRESA_FULL_FORM_CONFIG } from '@/lib/forms/schemas/empresa-full.schema';
import { FormConfig } from '@/lib/forms/types';
import { useCreateOperacao } from '@/features/operations/api/useOperacoes';
import { useCreateEmpresa } from '@/features/companies/api/useEmpresas';
import { useAuth } from '@/shared/hooks/useAuth';
import { useToast } from '@/shared/hooks/use-toast';
import { Building2 } from 'lucide-react';

interface NewDealWizardEmpresaV2Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Configuração de empresa customizada para o modal
 * Herda de EMPRESA_FULL_FORM_CONFIG com lógica de submissão customizada
 */
const getFormConfig = (
  onClose: () => void,
  onSubmit: (data: FieldValues) => Promise<void>
): FormConfig => {
  const config: FormConfig = {
    ...EMPRESA_FULL_FORM_CONFIG,
    id: 'empresa-modal-full',
    title: 'Novo Negócio - Empresa',
    submitLabel: 'Enviar para Análise',
    onSubmit,
  };

  return config;
};

/**
 * Componente refatorizado do NewDealWizardEmpresa usando FormWizard
 * Mantém compatibilidade com a API anterior
 */
export function NewDealWizardEmpresaV2({ open, onClose }: NewDealWizardEmpresaV2Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const createOperacao = useCreateOperacao();
  const createEmpresa = useCreateEmpresa();

  /**
   * Função de submissão do formulário
   * Cria empresa e operação com os dados do formulário
   */
  const handleSubmit = async (data: FieldValues) => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para criar uma operação.',
        variant: 'destructive',
      });
      throw new Error('User not authenticated');
    }

    try {
      // Map tipo to valid Segmento
      const segmentoMap: Record<
        string,
        'Startups' | 'Comercial' | 'Agronegócio' | 'Imobiliário' | 'Energia' | 'Ativos judiciais' | 'Outros'
      > = {
        economia_real: 'Comercial',
        tecnologia: 'Startups',
      };

      const segmentoValue = segmentoMap[data.tipoEmpresa as string] || 'Comercial';

      // Parse currency values
      const parseCurrency = (value: string): number => {
        if (!value) return 0;
        const cleanValue = value.replace(/[R$\s.]/g, '').replace(',', '.');
        return parseFloat(cleanValue) || 0;
      };

      // Calculate total value from faturamento
      const valorOperacao =
        parseCurrency(data.faturamento2025 as string) ||
        parseCurrency(data.faturamento2024 as string) ||
        parseCurrency(data.faturamento2023 as string) ||
        0;

      // Create empresa
      const empresaData = {
        nome: data.nomeEmpresarial as string,
        cnpj: (data.cnpj as string).replace(/\D/g, '') || '00000000000000',
        nome_fantasia: (data.nomeFantasia as string) || null,
        segmento: segmentoValue,
        contato_email: (data.emailEmpresario as string) || user.email || '',
        telefone: null,
        responsavel_id: user.id,
        valor_operacao: valorOperacao,
        tipo_operacao: 'Incorporação' as const,
        endereco_cep: null,
        endereco_logradouro: null,
        endereco_numero: null,
        endereco_complemento: null,
        endereco_bairro: null,
        endereco_cidade: null,
        endereco_uf: null,
        status_cadastro: 'incompleto' as const,
        criado_por_id: user.id,
      };

      const empresa = await createEmpresa.mutateAsync(empresaData);

      // Generate funil number
      const funilNumber = `OP-${Date.now().toString(36).toUpperCase()}`;

      // Create operação
      await createOperacao.mutateAsync({
        numero_funil: funilNumber,
        empresa_id: empresa.id,
        etapa_atual: 'Prospecto',
        sub_etapa: null,
        valor_investimento: valorOperacao,
        tipo_capital: 'Captação',
        segmento: segmentoValue,
        responsavel_id: user.id,
        office: 'Sudeste',
        lead_tag: 'frio',
        status_exclusividade: 'Sem exclusividade',
        data_exclusividade: null,
        observacoes: JSON.stringify({
          ...data,
          origemFormulario: 'empresa',
        }),
      });

      toast({
        title: 'Operação enviada!',
        description: 'Sua operação foi enviada para análise com sucesso.',
      });

      onClose();
    } catch (error: any) {
      console.error('Error creating operation:', error);
      toast({
        title: 'Erro ao criar operação',
        description: error.message || 'Ocorreu um erro. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const formConfig = getFormConfig(onClose, handleSubmit);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Novo Negócio - Empresa
          </DialogTitle>
        </DialogHeader>

        {/* FormWizard */}
        <div className="px-2">
          <FormWizard config={formConfig} onCancel={onClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
