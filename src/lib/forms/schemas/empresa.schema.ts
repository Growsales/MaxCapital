import { z } from 'zod';
import { FormConfig, FormStep } from '@/lib/forms/types';

/**
 * Validação CNPJ básica
 */
const cnpjRegex = /^[0-9]{2}\.?[0-9]{3}\.?[0-9]{3}\.?[0-9]{4}\.?[0-9]{2}$/;

/**
 * Validação de empresa
 */
const empresaValidation = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cnpj: z.string().regex(cnpjRegex, 'CNPJ inválido'),
  segmento: z.string().min(1, 'Segmento é obrigatório'),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  descricao: z.string().optional(),
});

/**
 * Steps do formulário de empresa
 */
const empresaSteps: FormStep[] = [
  {
    id: 'company-info',
    title: 'Informações da Empresa',
    description: 'Dados básicos da empresa',
    fields: [
      {
        name: 'nome',
        label: 'Nome da Empresa',
        type: 'text',
        placeholder: 'Ex: Tech Solutions LTDA',
        required: true,
        helpText: 'Nome completo da empresa',
      },
      {
        name: 'cnpj',
        label: 'CNPJ',
        type: 'cnpj',
        placeholder: '00.000.000/0000-00',
        required: true,
        helpText: 'CNPJ da empresa',
      },
      {
        name: 'segmento',
        label: 'Segmento',
        type: 'select',
        required: true,
        options: [
          { value: 'Startups', label: 'Startups' },
          { value: 'Comercial', label: 'Comercial' },
          { value: 'Agronegócio', label: 'Agronegócio' },
          { value: 'Manufatura', label: 'Manufatura' },
          { value: 'Serviços', label: 'Serviços' },
          { value: 'Varejo', label: 'Varejo' },
          { value: 'Outros', label: 'Outros' },
        ],
      },
    ],
  },
  {
    id: 'contact-info',
    title: 'Contato',
    description: 'Informações de contato da empresa',
    fields: [
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        placeholder: 'contato@empresa.com.br',
        required: true,
        helpText: 'Email de contato principal',
      },
      {
        name: 'telefone',
        label: 'Telefone',
        type: 'phone',
        placeholder: '(11) 98765-4321',
        helpText: 'Telefone para contato',
      },
    ],
  },
  {
    id: 'description',
    title: 'Descrição',
    description: 'Informações adicionais',
    fields: [
      {
        name: 'descricao',
        label: 'Sobre a Empresa',
        type: 'textarea',
        placeholder: 'Descreva o negócio da empresa...',
        helpText: 'Informações adicionais sobre a empresa',
      },
    ],
  },
  {
    id: 'review',
    title: 'Revisão',
    description: 'Revise os dados antes de enviar',
    fields: [
      {
        name: '_review',
        label: 'Por favor, revise os dados acima',
        type: 'text',
        disabled: true,
        hidden: true,
      },
    ],
  },
];

/**
 * Configuração completa do formulário de empresa
 */
export const EMPRESA_FORM_CONFIG: FormConfig = {
  id: 'empresa-create',
  title: 'Nova Empresa',
  description: 'Cadastre uma nova empresa',
  steps: empresaSteps,
  validation: empresaValidation,
  onSubmit: async (data) => {
    // Será implementado no componente que usa isto
    console.log('Submit empresa:', data);
  },
  submitLabel: 'Criar Empresa',
  saveDraft: true,
  autoSaveInterval: 30000,
};
