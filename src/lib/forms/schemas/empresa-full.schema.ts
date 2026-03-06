import { z } from 'zod';
import { FormConfig, FormStep } from '@/lib/forms/types';

/**
 * Validação completa de empresa (para wizard)
 * Inclui todos os campos do formulário completo com financeiros
 */
const empresaFullValidation = z.object({
  lgpdAccepted: z.boolean().refine((v) => v === true, {
    message: 'Você deve aceitar os termos LGPD para continuar',
  }),
  nomeEmpresarial: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cnpj: z.string().min(11, 'CNPJ inválido'),
  nomeFantasia: z.string().optional(),
  site: z.string().optional(),
  emailEmpresario: z.string().email('Email inválido'),
  sobreEmpresa: z.string().optional(),
  recuperacaoJudicial: z.enum(['sim', 'nao']).or(z.literal('')),
  balancoAuditado: z.enum(['sim', 'nao']).or(z.literal('')),
  receitaNaoDeclarada: z.enum(['sim', 'nao']).or(z.literal('')),
  tipoEmpresa: z.enum(['economia_real', 'tecnologia']),
  setores: z.array(z.string()).min(1, 'Selecione pelo menos um setor'),
  tiposOperacao: z.array(z.string()).min(1, 'Selecione pelo menos um tipo de operação'),
}).partial(); // Usar partial para validação por step

/**
 * Steps do formulário de empresa completo
 */
const empresaFullSteps: FormStep[] = [
  {
    id: 'lgpd',
    title: 'Confidencialidade',
    description: 'Conformidade com Lei Geral de Proteção de Dados',
    fields: [
      {
        name: 'lgpdAccepted',
        label: 'Aceito os termos de confidencialidade e proteção de dados',
        type: 'checkbox',
        required: true,
        helpText: 'Você deve aceitar os termos para continuar',
      },
    ],
  },

  {
    id: 'company-info',
    title: 'Informações Cadastrais',
    description: 'Dados básicos da empresa',
    fields: [
      {
        name: 'nomeEmpresarial',
        label: 'Nome Empresarial *',
        type: 'text',
        placeholder: 'Ex: Tech Solutions LTDA',
        required: true,
        helpText: 'Nome completo da empresa',
      },
      {
        name: 'cnpj',
        label: 'CNPJ *',
        type: 'cnpj',
        placeholder: '00.000.000/0000-00',
        required: true,
        helpText: 'CNPJ da empresa',
      },
      {
        name: 'nomeFantasia',
        label: 'Nome Fantasia',
        type: 'text',
        placeholder: 'Ex: Tech Solutions',
        helpText: 'Nome fantasia (opcional)',
      },
      {
        name: 'site',
        label: 'Website',
        type: 'text',
        placeholder: 'https://exemplo.com.br',
        helpText: 'Site da empresa (opcional)',
      },
      {
        name: 'emailEmpresario',
        label: 'Email para Contato *',
        type: 'email',
        placeholder: 'contato@empresa.com.br',
        required: true,
        helpText: 'Email do empresário ou responsável',
      },
      {
        name: 'sobreEmpresa',
        label: 'Sobre a Empresa',
        type: 'textarea',
        placeholder: 'Descreva o negócio da empresa...',
        helpText: 'Descrição breve das atividades',
      },
      {
        name: 'recuperacaoJudicial',
        label: 'A empresa está em recuperação judicial?',
        type: 'radio',
        options: [
          { value: 'nao', label: 'Não' },
          { value: 'sim', label: 'Sim' },
        ],
      },
      {
        name: 'balancoAuditado',
        label: 'Possui balanço auditado?',
        type: 'radio',
        options: [
          { value: 'nao', label: 'Não' },
          { value: 'sim', label: 'Sim' },
        ],
      },
      {
        name: 'receitaNaoDeclarada',
        label: 'Possui receita não declarada?',
        type: 'radio',
        options: [
          { value: 'nao', label: 'Não' },
          { value: 'sim', label: 'Sim' },
        ],
      },
    ],
  },

  {
    id: 'classification',
    title: 'Classificação',
    description: 'Tipo e setores de atuação',
    fields: [
      {
        name: 'tipoEmpresa',
        label: 'Tipo de Empresa *',
        type: 'select',
        required: true,
        options: [
          { value: 'economia_real', label: 'Economia Real' },
          { value: 'tecnologia', label: 'Tecnologia' },
        ],
      },
      {
        name: 'setores',
        label: 'Setores de Atuação *',
        type: 'multiselect',
        required: true,
        placeholder: 'Selecione os setores',
        options: [
          // Economia Real
          { value: 'agro', label: 'Agro' },
          { value: 'real_estate', label: 'Atividades Imobiliárias (Real Estate)' },
          { value: 'construcao', label: 'Construção e Infra-Estrutura' },
          { value: 'servicos_tecnicos', label: 'Serviços Prof., Científicos e Técnicos' },
          { value: 'servicos_adm', label: 'Serviços Adm. e Complementares' },
          { value: 'educacao', label: 'Educação' },
          { value: 'outros_servicos', label: 'Outros Serviços Pessoais' },
          { value: 'educacao_corporativa', label: 'Educação corporativa' },
          { value: 'franquiadora', label: 'Franquiadora' },
          { value: 'marketing', label: 'Marketing, publicidade e propaganda' },
          // Tecnologia
          { value: 'fintech', label: 'Fintech' },
          { value: 'insurtech', label: 'Insurtech' },
          { value: 'healthtech', label: 'Healthtech' },
          { value: 'logtech', label: 'Logtech' },
          { value: 'retailtech', label: 'Retailtech' },
          { value: 'legaltech', label: 'Legaltech' },
          { value: 'agrotech', label: 'Agrotech' },
          { value: 'edtech', label: 'Edtech' },
          { value: 'foodtech', label: 'Foodtech' },
          { value: 'construtech', label: 'Construtech' },
          { value: 'proptech', label: 'Proptech' },
          { value: 'hrtech', label: 'HRtech' },
        ],
      },
    ],
  },

  {
    id: 'financial-info',
    title: 'Informações Financeiras',
    description: 'Dados financeiros da empresa',
    fields: [
      {
        name: 'faturamento2023',
        label: 'Faturamento 2023',
        type: 'currency',
        placeholder: 'R$ 0,00',
        helpText: 'Faturamento anual 2023',
      },
      {
        name: 'faturamento2024',
        label: 'Faturamento 2024',
        type: 'currency',
        placeholder: 'R$ 0,00',
        helpText: 'Faturamento anual 2024',
      },
      {
        name: 'faturamento2025',
        label: 'Faturamento 2025 (Projetado)',
        type: 'currency',
        placeholder: 'R$ 0,00',
        helpText: 'Faturamento projetado 2025',
      },
      {
        name: 'faturamento2026',
        label: 'Faturamento 2026 (Projetado)',
        type: 'currency',
        placeholder: 'R$ 0,00',
        helpText: 'Faturamento projetado 2026',
      },
      {
        name: 'ebitda2023',
        label: 'EBITDA 2023',
        type: 'currency',
        placeholder: 'R$ 0,00',
        helpText: 'EBITDA 2023',
      },
      {
        name: 'ebitda2024',
        label: 'EBITDA 2024',
        type: 'currency',
        placeholder: 'R$ 0,00',
        helpText: 'EBITDA 2024',
      },
      {
        name: 'ebitda2025',
        label: 'EBITDA 2025 (Projetado)',
        type: 'currency',
        placeholder: 'R$ 0,00',
        helpText: 'EBITDA projetado 2025',
      },
      {
        name: 'ebitda2026',
        label: 'EBITDA 2026 (Projetado)',
        type: 'currency',
        placeholder: 'R$ 0,00',
        helpText: 'EBITDA projetado 2026',
      },
      {
        name: 'possuiDividas',
        label: 'A empresa possui dívidas?',
        type: 'radio',
        options: [
          { value: 'nao', label: 'Não' },
          { value: 'sim', label: 'Sim' },
        ],
      },
      {
        name: 'endividamentoBancario',
        label: 'Endividamento Bancário',
        type: 'currency',
        placeholder: 'R$ 0,00',
        condition: (data) => data.possuiDividas === 'sim',
      },
      {
        name: 'endividamentoFornecedores',
        label: 'Endividamento com Fornecedores',
        type: 'currency',
        placeholder: 'R$ 0,00',
        condition: (data) => data.possuiDividas === 'sim',
      },
      {
        name: 'endividamentoTributario',
        label: 'Endividamento Tributário',
        type: 'currency',
        placeholder: 'R$ 0,00',
        condition: (data) => data.possuiDividas === 'sim',
      },
      {
        name: 'outrosEndividamentos',
        label: 'Outros Endividamentos',
        type: 'currency',
        placeholder: 'R$ 0,00',
        condition: (data) => data.possuiDividas === 'sim',
      },
    ],
  },

  {
    id: 'operation-types',
    title: 'Tipos de Operação',
    description: 'Tipos de operação e bens patrimoniais',
    fields: [
      {
        name: 'tiposOperacao',
        label: 'Tipos de Operação Desejados *',
        type: 'multiselect',
        required: true,
        options: [
          { value: 'ma', label: 'M&A (Fusões e Aquisições)' },
          { value: 'credito', label: 'Crédito' },
          { value: 'financiamento_obras', label: 'Financiamento para término de obras' },
          { value: 'capital_giro', label: 'Capital de Giro' },
          { value: 'expansao', label: 'Expansão' },
        ],
      },
      {
        name: 'observacoesGerais',
        label: 'Observações Gerais',
        type: 'textarea',
        placeholder: 'Adicione informações complementares...',
        helpText: 'Qualquer informação adicional relevante',
      },
    ],
  },
];

/**
 * Configuração completa do formulário de empresa com wizard
 */
export const EMPRESA_FULL_FORM_CONFIG: FormConfig = {
  id: 'empresa-create-full',
  title: 'Nova Empresa - Formulário Completo',
  description: 'Cadastre uma nova empresa com todas as informações',
  steps: empresaFullSteps,
  validation: empresaFullValidation,
  onSubmit: async (data) => {
    // Será implementado no componente que usa isto
    console.log('Submit empresa full:', data);
  },
  submitLabel: 'Enviar Formulário',
  saveDraft: true,
  autoSaveInterval: 30000,
};
