import { z } from 'zod';
import { FormConfig, FormStep } from '@/lib/forms/types';

/**
 * Validação de operação - Abrange todos os setores
 */
const operacaoValidation = z.object({
  lgpdAccepted: z.boolean().refine((v) => v === true, {
    message: 'Você deve aceitar os termos LGPD para continuar',
  }),
  setor: z.string().min(1, 'Setor é obrigatório'),
  segmento: z.string().min(1, 'Segmento é obrigatório'),
  nomeProjeto: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cnpj: z.string().min(11, 'CNPJ inválido'),
});

/**
 * Steps do formulário de operação - Schema unificado para todos os setores
 */
const operacaoSteps: FormStep[] = [
  {
    id: 'lgpd',
    title: 'Termo LGPD',
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
    id: 'setor',
    title: 'Setor',
    description: 'Selecione o setor da operação',
    fields: [
      {
        name: 'setor',
        label: 'Setor',
        type: 'select',
        placeholder: 'Escolha o setor',
        required: true,
        options: [
          { value: 'agronegocio', label: 'Agronegócio' },
          { value: 'infraestrutura', label: 'Infraestrutura' },
          { value: 'imobiliario', label: 'Imobiliário' },
          { value: 'tech', label: 'Tech' },
          { value: 'negocios', label: 'Negócios' },
          { value: 'outros', label: 'Outros' },
        ],
      },
    ],
  },

  {
    id: 'segmento',
    title: 'Segmento',
    description: 'Especifique o segmento dentro do setor',
    fields: [
      {
        name: 'segmento',
        label: 'Segmento',
        type: 'select',
        placeholder: 'Escolha o segmento',
        required: true,
        options: [
          { value: 'tech', label: 'Startups' },
          { value: 'comercial', label: 'Comercial' },
          { value: 'agronegocio', label: 'Agronegócio' },
          { value: 'imobiliario', label: 'Imobiliário' },
          { value: 'energia', label: 'Energia' },
          { value: 'ativos_judiciais', label: 'Ativos Judiciais' },
          { value: 'outros', label: 'Outros' },
        ],
      },
    ],
  },

  {
    id: 'localizacao',
    title: 'Localização',
    description: 'Dados de localização da operação',
    fields: [
      {
        name: 'cep',
        label: 'CEP',
        type: 'text',
        placeholder: '00000-000',
        helpText: 'CEP da localização principal',
        condition: (data) => data.setor !== 'tech',
      },
      {
        name: 'cidade',
        label: 'Cidade',
        type: 'text',
        placeholder: 'São Paulo',
        condition: (data) => data.setor !== 'tech',
      },
      {
        name: 'uf',
        label: 'Estado (UF)',
        type: 'select',
        placeholder: 'SP',
        options: [
          { value: 'AC', label: 'Acre' },
          { value: 'AL', label: 'Alagoas' },
          { value: 'AP', label: 'Amapá' },
          { value: 'AM', label: 'Amazonas' },
          { value: 'BA', label: 'Bahia' },
          { value: 'CE', label: 'Ceará' },
          { value: 'DF', label: 'Distrito Federal' },
          { value: 'ES', label: 'Espírito Santo' },
          { value: 'GO', label: 'Goiás' },
          { value: 'MA', label: 'Maranhão' },
          { value: 'MT', label: 'Mato Grosso' },
          { value: 'MS', label: 'Mato Grosso do Sul' },
          { value: 'MG', label: 'Minas Gerais' },
          { value: 'PA', label: 'Pará' },
          { value: 'PB', label: 'Paraíba' },
          { value: 'PR', label: 'Paraná' },
          { value: 'PE', label: 'Pernambuco' },
          { value: 'PI', label: 'Piauí' },
          { value: 'RJ', label: 'Rio de Janeiro' },
          { value: 'RN', label: 'Rio Grande do Norte' },
          { value: 'RS', label: 'Rio Grande do Sul' },
          { value: 'RO', label: 'Rondônia' },
          { value: 'RR', label: 'Roraima' },
          { value: 'SC', label: 'Santa Catarina' },
          { value: 'SP', label: 'São Paulo' },
          { value: 'SE', label: 'Sergipe' },
          { value: 'TO', label: 'Tocantins' },
        ],
        condition: (data) => data.setor !== 'tech',
      },
      {
        name: 'estagioStartup',
        label: 'Estágio da Startup',
        type: 'select',
        placeholder: 'Escolha o estágio',
        options: [
          { value: 'idea', label: 'Ideia/Pré-operacional' },
          { value: 'mvp', label: 'MVP desenvolvido' },
          { value: 'operando', label: 'Operando com clientes' },
          { value: 'crescimento', label: 'Crescimento' },
          { value: 'scaleup', label: 'Scale-up' },
        ],
        condition: (data) => data.setor === 'tech',
      },
    ],
  },

  {
    id: 'dados-basicos',
    title: 'Dados Básicos',
    description: 'Informações fundamentais do projeto',
    fields: [
      {
        name: 'nomeProjeto',
        label: 'Nome do Projeto',
        type: 'text',
        placeholder: 'Ex: Projeto ABC',
        required: true,
        helpText: 'Nome da operação ou projeto',
      },
      {
        name: 'cnpj',
        label: 'CNPJ',
        type: 'cnpj',
        placeholder: '00.000.000/0000-00',
        required: true,
        helpText: 'CNPJ da empresa ou projeto',
      },
      {
        name: 'nomeEmpresa',
        label: 'Nome da Empresa',
        type: 'text',
        placeholder: 'Ex: ABC Incorporações Ltda.',
        helpText: 'Razão social ou nome fantasia da empresa',
      },
    ],
  },

  {
    id: 'investimento',
    title: 'Dados de Investimento',
    description: 'Informações financeiras da operação',
    fields: [
      {
        name: 'investimentoNecessario',
        label: 'Investimento Necessário',
        type: 'currency',
        placeholder: '0,00',
        required: true,
        helpText: 'Valor total de investimento solicitado',
      },
      {
        name: 'valorTotal',
        label: 'Valor Total',
        type: 'currency',
        placeholder: '0,00',
        helpText: 'Valor total da operação ou faturamento estimado',
      },
      {
        name: 'tirProjetada',
        label: 'TIR Projetada (%)',
        type: 'number',
        placeholder: '0',
        helpText: 'Taxa Interna de Retorno esperada',
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
        label: 'Por favor, revise todos os dados acima antes de enviar.',
        type: 'text',
        disabled: true,
        hidden: true,
      },
    ],
  },
];

/**
 * Configuração completa do formulário de operação
 */
export const OPERACAO_FORM_CONFIG: FormConfig = {
  id: 'operacao-create',
  title: 'Nova Operação de Investimento',
  description: 'Preencha os dados da nova operação',
  steps: operacaoSteps,
  validation: operacaoValidation.partial(), // Usar partial para permitir validação por step
  onSubmit: async (data) => {
    // Será implementado no componente que usa isto
    console.log('Submit operacao:', data);
  },
  submitLabel: 'Enviar para Análise',
  saveDraft: true,
  autoSaveInterval: 30000,
};
