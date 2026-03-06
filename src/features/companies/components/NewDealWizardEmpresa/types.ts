// Types for the Enterprise New Deal Wizard

export interface EmpresaFormData {
  // LGPD
  lgpdAccepted: boolean;
  lgpdAcceptedAt: string | null;
  // Step 1: Informações Cadastrais
  nomeEmpresarial: string;
  cnpj: string;
  nomeEmpresa: string;
  nomeFantasia: string;
  site: string;
  emailEmpresario: string;
  sobreEmpresa: string;
  recuperacaoJudicial: 'sim' | 'nao' | '';
  balancoAuditado: 'sim' | 'nao' | '';
  receitaNaoDeclarada: 'sim' | 'nao' | '';

  // Step 2: Classificação
  tipoEmpresa: 'economia_real' | 'tecnologia' | '';
  setores: string[];

  // Step 3: Informações Financeiras
  faturamento2023: string;
  faturamento2024: string;
  faturamento2025: string;
  faturamento2026: string;
  ebitda2023: string;
  ebitda2024: string;
  ebitda2025: string;
  ebitda2026: string;
  possuiDividas: 'sim' | 'nao' | '';
  endividamentoBancario: string;
  endividamentoFornecedores: string;
  endividamentoTributario: string;
  outrosEndividamentos: string;

  // Step 4: Tipo de Operação
  tiposOperacao: string[];
  patrimonioBens: PatrimonioBem[];
  observacoesGerais: string;
}

export interface PatrimonioBem {
  id: string;
  tipo: string;
  descricao: string;
  valorEstimado: string;
}

export const initialEmpresaFormData: EmpresaFormData = {
  lgpdAccepted: false,
  lgpdAcceptedAt: null,
  nomeEmpresarial: '',
  cnpj: '',
  nomeEmpresa: '',
  nomeFantasia: '',
  site: '',
  emailEmpresario: '',
  sobreEmpresa: '',
  recuperacaoJudicial: '',
  balancoAuditado: '',
  receitaNaoDeclarada: '',
  tipoEmpresa: '',
  setores: [],
  faturamento2023: '',
  faturamento2024: '',
  faturamento2025: '',
  faturamento2026: '',
  ebitda2023: '',
  ebitda2024: '',
  ebitda2025: '',
  ebitda2026: '',
  possuiDividas: '',
  endividamentoBancario: '',
  endividamentoFornecedores: '',
  endividamentoTributario: '',
  outrosEndividamentos: '',
  tiposOperacao: [],
  patrimonioBens: [],
  observacoesGerais: '',
};

export const SETORES_ECONOMIA_REAL = [
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
];

export const SETORES_TECNOLOGIA = [
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
];

export const TIPOS_OPERACAO_EMPRESA = [
  { value: 'ma', label: 'M&A (Fusões e Aquisições)', description: 'Operações de compra, venda ou fusão de empresas' },
  { value: 'credito', label: 'Crédito', description: 'Financiamentos e linhas de crédito' },
  { value: 'financiamento_obras', label: 'Financiamento para término de obras', description: 'Capital para conclusão de projetos de construção' },
  { value: 'capital_giro', label: 'Capital de Giro', description: 'Recursos para operações do dia a dia' },
  { value: 'expansao', label: 'Expansão', description: 'Investimento para crescimento do negócio' },
];

export const TIPOS_PATRIMONIO = [
  { value: 'imovel_urbano', label: 'Imóvel Urbano' },
  { value: 'imovel_rural', label: 'Imóvel Rural' },
  { value: 'veiculo', label: 'Veículo' },
  { value: 'equipamento', label: 'Equipamento' },
  { value: 'aplicacao_financeira', label: 'Aplicação Financeira' },
  { value: 'participacao_societaria', label: 'Participação Societária' },
  { value: 'outros', label: 'Outros' },
];
