import { useState, useEffect } from 'react';
import { z } from 'zod';
import { Building2 } from 'lucide-react';
import { Input } from '@/shared/components/input';
import { Label } from '@/shared/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/select';
import { GenericModal, FormModalContent } from '@/lib/design-system';
import { useUpdateEmpresa } from '@/features/companies/api/useEmpresas';
import { useToast } from '@/shared/hooks/use-toast';
import { FileUploadField } from '@/features/admin/components/FileUploadField';
import { getSetores } from '@/lib/setores-segmentos';
import type { Tables, TipoOperacao } from '@/types/supabase';

type Empresa = Tables<'empresas'>;

interface EditCompanyModalProps {
  open: boolean;
  onClose: () => void;
  empresa: Empresa | null;
}

// Setores are loaded dynamically from the shared registry

const tiposOperacao: TipoOperacao[] = [
  'Investimento',
  'Crédito',
  'Expansão',
  'Incorporação',
  'Financiamento',
];

const statusExclusividadeOptions = ['Ativo', 'Vencido', 'Sem exclusividade'] as const;

const empresaSchema = z.object({
  nome: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/, 'CNPJ inválido'),
  nome_fantasia: z.string().max(100).optional().nullable(),
  segmento: z.string().min(1, 'Setor é obrigatório'),
  contato_email: z.string().trim().email('E-mail inválido').max(255),
  telefone: z.string().max(20).optional().nullable(),
  tipo_operacao: z.enum(['Investimento', 'Crédito', 'Expansão', 'Incorporação', 'Financiamento']),
  logo_url: z.string().optional().nullable(),
  status_exclusividade: z.string().optional().nullable(),
  data_exclusividade: z.string().optional().nullable(),
  endereco_cep: z.string().max(10).optional().nullable(),
  endereco_logradouro: z.string().max(200).optional().nullable(),
  endereco_numero: z.string().max(20).optional().nullable(),
  endereco_complemento: z.string().max(100).optional().nullable(),
  endereco_bairro: z.string().max(100).optional().nullable(),
  endereco_cidade: z.string().max(100).optional().nullable(),
  endereco_uf: z.string().max(2).optional().nullable(),
});

type EmpresaFormData = z.infer<typeof empresaSchema>;

export function EditCompanyModal({ open, onClose, empresa }: EditCompanyModalProps) {
  const updateEmpresa = useUpdateEmpresa();
  const { toast } = useToast();
  const [formData, setFormData] = useState<EmpresaFormData | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (empresa && open) {
      setFormData({
        nome: empresa.nome || '',
        cnpj: formatCNPJ(empresa.cnpj || ''),
        nome_fantasia: empresa.nome_fantasia || '',
        segmento: empresa.segmento || '',
        contato_email: empresa.contato_email || '',
        telefone: empresa.telefone ? formatPhone(empresa.telefone) : '',
        tipo_operacao: (empresa.tipo_operacao as TipoOperacao) || 'Investimento',
        logo_url: empresa.logo_url || '',
        status_exclusividade: empresa.status_exclusividade || 'Sem exclusividade',
        data_exclusividade: empresa.data_exclusividade || '',
        endereco_cep: empresa.endereco_cep ? formatCEP(empresa.endereco_cep) : '',
        endereco_logradouro: empresa.endereco_logradouro || '',
        endereco_numero: empresa.endereco_numero || '',
        endereco_complemento: empresa.endereco_complemento || '',
        endereco_bairro: empresa.endereco_bairro || '',
        endereco_cidade: empresa.endereco_cidade || '',
        endereco_uf: empresa.endereco_uf || '',
      });
      setCurrentStep(1);
      setErrors({});
    }
  }, [empresa, open]);

  const handleInputChange = (field: keyof EmpresaFormData, value: string | number | null) => {
    if (!formData) return;
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 14) {
      return numbers
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return value;
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d)/, '$1-$2');
    }
    return value;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }
    return value;
  };

  const validateStep = (step: number): boolean => {
    if (!formData) return false;
    
    let fieldsToValidate: (keyof EmpresaFormData)[] = [];
    
    if (step === 1) {
      fieldsToValidate = ['nome', 'cnpj', 'segmento'];
    } else if (step === 2) {
      fieldsToValidate = ['contato_email', 'tipo_operacao'];
    }

    const partialSchema = empresaSchema.pick(
      fieldsToValidate.reduce((acc, field) => ({ ...acc, [field]: true }), {} as Record<keyof EmpresaFormData, true>)
    );

    const result = partialSchema.safeParse(formData);
    
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep) || !empresa || !formData) return;

    const result = empresaSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    try {
      await updateEmpresa.mutateAsync({
        id: empresa.id,
        nome: formData.nome.trim(),
        cnpj: formData.cnpj.replace(/\D/g, ''),
        nome_fantasia: formData.nome_fantasia?.trim() || null,
        segmento: formData.segmento,
        contato_email: formData.contato_email.trim(),
        telefone: formData.telefone?.replace(/\D/g, '') || null,
        tipo_operacao: formData.tipo_operacao,
        logo_url: formData.logo_url || null,
        status_exclusividade: formData.status_exclusividade || 'Sem exclusividade',
        data_exclusividade: formData.status_exclusividade === 'Ativo' ? (formData.data_exclusividade || null) : null,
        endereco_cep: formData.endereco_cep?.replace(/\D/g, '') || null,
        endereco_logradouro: formData.endereco_logradouro?.trim() || null,
        endereco_numero: formData.endereco_numero?.trim() || null,
        endereco_complemento: formData.endereco_complemento?.trim() || null,
        endereco_bairro: formData.endereco_bairro?.trim() || null,
        endereco_cidade: formData.endereco_cidade?.trim() || null,
        endereco_uf: formData.endereco_uf?.toUpperCase() || null,
      } as any);

      toast({
        title: 'Empresa atualizada',
        description: 'Os dados foram salvos com sucesso!',
      });

      handleClose();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar',
        description: error?.message || 'Não foi possível atualizar a empresa.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    setFormData(null);
    setCurrentStep(1);
    setErrors({});
    onClose();
  };

  if (!formData) return null;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Dados da Empresa</h3>

            <FileUploadField
              label="Logo da Empresa"
              value={formData.logo_url || ''}
              onChange={(val) => handleInputChange('logo_url', val)}
              accept="image/*"
              placeholder="https://exemplo.com/logo.png"
            />

            <div className="space-y-2">
              <Label htmlFor="edit-nome">Razão Social *</Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                placeholder="Nome da empresa"
                className={errors.nome ? 'border-destructive' : ''}
              />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-nome_fantasia">Nome Fantasia</Label>
              <Input
                id="edit-nome_fantasia"
                value={formData.nome_fantasia || ''}
                onChange={(e) => handleInputChange('nome_fantasia', e.target.value)}
                placeholder="Nome fantasia (opcional)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-cnpj">CNPJ *</Label>
              <Input
                id="edit-cnpj"
                value={formData.cnpj}
                onChange={(e) => handleInputChange('cnpj', formatCNPJ(e.target.value))}
                placeholder="00.000.000/0000-00"
                maxLength={18}
                className={errors.cnpj ? 'border-destructive' : ''}
              />
              {errors.cnpj && <p className="text-xs text-destructive">{errors.cnpj}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-segmento">Setor *</Label>
              <Select
                value={formData.segmento}
                onValueChange={(value) => handleInputChange('segmento', value)}
              >
                <SelectTrigger className={errors.segmento ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                  {getSetores().map((setor) => (
                    <SelectItem key={setor.value} value={setor.value}>{setor.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.segmento && <p className="text-xs text-destructive">{errors.segmento}</p>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Contato e Operação</h3>

            <div className="space-y-2">
              <Label htmlFor="edit-contato_email">E-mail de Contato *</Label>
              <Input
                id="edit-contato_email"
                type="email"
                value={formData.contato_email}
                onChange={(e) => handleInputChange('contato_email', e.target.value)}
                placeholder="email@empresa.com"
                className={errors.contato_email ? 'border-destructive' : ''}
              />
              {errors.contato_email && <p className="text-xs text-destructive">{errors.contato_email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-telefone">Telefone</Label>
              <Input
                id="edit-telefone"
                value={formData.telefone || ''}
                onChange={(e) => handleInputChange('telefone', formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>

          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Endereço (Opcional)</h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-endereco_cep">CEP</Label>
                <Input
                  id="edit-endereco_cep"
                  value={formData.endereco_cep || ''}
                  onChange={(e) => handleInputChange('endereco_cep', formatCEP(e.target.value))}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="edit-endereco_uf">UF</Label>
                <Input
                  id="edit-endereco_uf"
                  value={formData.endereco_uf || ''}
                  onChange={(e) => handleInputChange('endereco_uf', e.target.value.toUpperCase())}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-endereco_logradouro">Logradouro</Label>
              <Input
                id="edit-endereco_logradouro"
                value={formData.endereco_logradouro || ''}
                onChange={(e) => handleInputChange('endereco_logradouro', e.target.value)}
                placeholder="Rua, Avenida..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-endereco_numero">Número</Label>
                <Input
                  id="edit-endereco_numero"
                  value={formData.endereco_numero || ''}
                  onChange={(e) => handleInputChange('endereco_numero', e.target.value)}
                  placeholder="000"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="edit-endereco_complemento">Complemento</Label>
                <Input
                  id="edit-endereco_complemento"
                  value={formData.endereco_complemento || ''}
                  onChange={(e) => handleInputChange('endereco_complemento', e.target.value)}
                  placeholder="Sala, Andar..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-endereco_bairro">Bairro</Label>
                <Input
                  id="edit-endereco_bairro"
                  value={formData.endereco_bairro || ''}
                  onChange={(e) => handleInputChange('endereco_bairro', e.target.value)}
                  placeholder="Bairro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endereco_cidade">Cidade</Label>
                <Input
                  id="edit-endereco_cidade"
                  value={formData.endereco_cidade || ''}
                  onChange={(e) => handleInputChange('endereco_cidade', e.target.value)}
                  placeholder="Cidade"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleConfirm = async () => {
    if (currentStep < 3) {
      handleNext();
    } else {
      await handleSubmit();
    }
  };

  const handleModalClose = () => {
    if (currentStep > 1) {
      handleBack();
    } else {
      handleClose();
    }
  };

  return (
    <GenericModal
      open={open}
      onClose={handleModalClose}
      onConfirm={handleConfirm}
      title="Editar Empresa"
      description={`Etapa ${currentStep} de 3`}
      icon={Building2}
      variant="default"
      confirmLabel={currentStep < 3 ? 'Próximo' : 'Salvar Alterações'}
      cancelLabel={currentStep > 1 ? 'Voltar' : 'Cancelar'}
      showConfirmButton={true}
      showCancelButton={true}
      isLoading={updateEmpresa.isPending}
      size="lg"
    >
      <FormModalContent>
        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`flex-1 h-1 rounded-full transition-colors ${
                step <= currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Form Content */}
        {renderStepContent()}
      </FormModalContent>
    </GenericModal>
  );
}
