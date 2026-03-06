// Types for the New Deal Wizard

export interface WizardFormData {
  // Step 1: LGPD
  lgpdAccepted: boolean;
  lgpdAcceptedAt: string | null;
  
  // Step 2: Setor
  setor: string;
  
  // Step 3: Segmento
  segmento: string;
  
  // Step 4: Status/Tipo específico por setor
  statusProjeto: string;
  tipoProducao: string;
  tipoProjeto: string;
  modeloNegocio: string;
  tipoOperacao: string;
  tipoAtivo: string;
  
  // Step 5: Localização / Estágio
  cep: string;
  cidade: string;
  uf: string;
  abrangencia: string;
  estadosAtendidos: string;
  tamanhoPropriedade: string;
  multiplasUnidades: boolean;
  quantidadeUnidades: string;
  estadosAtuacao: string;
  estagioStartup: string;
  
  // Step 6: Características
  tipoProduto: string[];
  publicoAlvo: string[];
  
  // Agronegócio
  culturaAtividade: string;
  infraestruturaInstalada: string;
  certificacoes: string[];
  
  // Infraestrutura
  estagioInfra: string;
  prazoConcessao: string;
  tipoReceita: string;
  
  // Tech
  possuiClientes: boolean;
  quantidadeClientes: string;
  mrrAtual: string;
  tamMercado: string;
  samMercado: string;
  
  // Negócios
  tempoOperacao: string;
  numeroFuncionarios: string;
  faixaFaturamento: string;
  
  // Outros - Ativos Judiciais
  tipoAtivoJudicial: string;
  valorFace: string;
  desagioEsperado: string;
  previsaoRecebimento: string;
  
  // Outros - Fundos
  tipoFundo: string;
  patrimonioAlvo: string;
  taxaAdministracao: string;
  taxaPerformance: string;
  
  // Outros - Crédito
  tipoOperacaoCredito: string;
  ratingCredito: string;
  garantiasCredito: string;
  descricaoAtivo: string;
  
  // Step 7: Dados Completos - Básicos
  nomeProjeto: string;
  cnpj: string;
  nomeEmpresa: string;
  descricao: string;
  
  // Imobiliário
  areaTerreno: string;
  areaConstruida: string;
  numeroUnidades: string;
  areaMediaUnidade: string;
  custoTotalObra: string;
  margemLucro: string;
  dataInicioPrevista: string;
  dataConclusaoPrevista: string;
  statusAprovacoes: string;
  
  // Agronegócio
  areaTotal: string;
  areaProdutiva: string;
  tipoSolo: string;
  fonteAgua: string;
  produtividadeEsperada: string;
  cicloProducao: string;
  capacidadeAnual: string;
  mercadoAlvo: string;
  receitaAnualEstimada: string;
  
  // Infraestrutura
  extensaoCapacidade: string;
  tecnologia: string;
  vidaUtil: string;
  capacidadeAtendimento: string;
  orgaoRegulador: string;
  statusRegulatorio: string;
  numeroConcessao: string;
  prazoConcessaoAnos: string;
  capex: string;
  opex: string;
  payback: string;
  receitaAnual: string;
  
  // Tech
  estagioDesenvolvimento: string;
  stackTecnologica: string;
  diferencialCompetitivo: string;
  concorrentes: string;
  usuariosAtivos: string;
  mrr: string;
  arr: string;
  taxaChurn: string;
  ltv: string;
  cac: string;
  valuation: string;
  investimentoCaptado: string;
  diluicaoOferecida: string;
  runway: string;
  breakeven: string;
  numFuncionarios: string;
  founders: string;
  advisors: string;
  linkDemo: string;
  
  // Negócios
  anoFundacao: string;
  numUnidades: string;
  areaUnidades: string;
  capacidadeClientesMes: string;
  faturamentoAnual: string;
  ebitda: string;
  margemEbitda: string;
  dividaAtual: string;
  finalidadeInvestimento: string[];
  
  // Financeiros comuns
  vgvEstimado: string;
  investimentoNecessario: string;
  ticketMinimo: string;
  tirProjetada: string;
  prazoOperacao: string;
  retornoEsperado: string;
  valorTotal: string;
  
  // Documentação
  teaserUrl: string | null;
  estudoViabilidadeUrl: string | null;
  googleDriveLink: string;
  observacoes: string;
}

export const initialFormData: WizardFormData = {
  lgpdAccepted: false,
  lgpdAcceptedAt: null,
  setor: '',
  segmento: '',
  statusProjeto: 'Sim, mas a obra ainda não começou',
  tipoProducao: '',
  tipoProjeto: '',
  modeloNegocio: '',
  tipoOperacao: '',
  tipoAtivo: '',
  cep: '',
  cidade: '',
  uf: '',
  abrangencia: '',
  estadosAtendidos: '',
  tamanhoPropriedade: '',
  multiplasUnidades: false,
  quantidadeUnidades: '',
  estadosAtuacao: '',
  estagioStartup: '',
  tipoProduto: [],
  publicoAlvo: [],
  culturaAtividade: '',
  infraestruturaInstalada: '',
  certificacoes: [],
  estagioInfra: '',
  prazoConcessao: '',
  tipoReceita: '',
  possuiClientes: false,
  quantidadeClientes: '',
  mrrAtual: '',
  tamMercado: '',
  samMercado: '',
  tempoOperacao: '',
  numeroFuncionarios: '',
  faixaFaturamento: '',
  tipoAtivoJudicial: '',
  valorFace: '',
  desagioEsperado: '',
  previsaoRecebimento: '',
  tipoFundo: '',
  patrimonioAlvo: '',
  taxaAdministracao: '',
  taxaPerformance: '',
  tipoOperacaoCredito: '',
  ratingCredito: '',
  garantiasCredito: '',
  descricaoAtivo: '',
  nomeProjeto: '',
  cnpj: '',
  nomeEmpresa: '',
  descricao: '',
  areaTerreno: '',
  areaConstruida: '',
  numeroUnidades: '',
  areaMediaUnidade: '',
  custoTotalObra: '',
  margemLucro: '',
  dataInicioPrevista: '',
  dataConclusaoPrevista: '',
  statusAprovacoes: '',
  areaTotal: '',
  areaProdutiva: '',
  tipoSolo: '',
  fonteAgua: '',
  produtividadeEsperada: '',
  cicloProducao: '',
  capacidadeAnual: '',
  mercadoAlvo: '',
  receitaAnualEstimada: '',
  extensaoCapacidade: '',
  tecnologia: '',
  vidaUtil: '',
  capacidadeAtendimento: '',
  orgaoRegulador: '',
  statusRegulatorio: '',
  numeroConcessao: '',
  prazoConcessaoAnos: '',
  capex: '',
  opex: '',
  payback: '',
  receitaAnual: '',
  estagioDesenvolvimento: '',
  stackTecnologica: '',
  diferencialCompetitivo: '',
  concorrentes: '',
  usuariosAtivos: '',
  mrr: '',
  arr: '',
  taxaChurn: '',
  ltv: '',
  cac: '',
  valuation: '',
  investimentoCaptado: '',
  diluicaoOferecida: '',
  runway: '',
  breakeven: '',
  numFuncionarios: '',
  founders: '',
  advisors: '',
  linkDemo: '',
  anoFundacao: '',
  numUnidades: '',
  areaUnidades: '',
  capacidadeClientesMes: '',
  faturamentoAnual: '',
  ebitda: '',
  margemEbitda: '',
  dividaAtual: '',
  finalidadeInvestimento: [],
  vgvEstimado: '',
  investimentoNecessario: '',
  ticketMinimo: '',
  tirProjetada: '',
  prazoOperacao: '',
  retornoEsperado: '',
  valorTotal: '',
  teaserUrl: null,
  estudoViabilidadeUrl: null,
  googleDriveLink: '',
  observacoes: '',
};

export const SETORES = [
  { value: 'agronegocio', label: 'Agronegócio', icon: 'Wheat' },
  { value: 'infraestrutura', label: 'Infraestrutura', icon: 'HardHat' },
  { value: 'imobiliario', label: 'Imobiliário', icon: 'Building2' },
  { value: 'tech', label: 'Tech', icon: 'Monitor' },
  { value: 'negocios', label: 'Negócios', icon: 'Briefcase' },
  { value: 'outros', label: 'Outros', icon: 'Package' },
];

export const SEGMENTOS_POR_SETOR: Record<string, { value: string; label: string; description: string }[]> = {
  imobiliario: [
    { value: 'incorporacao', label: 'Incorporação', description: 'Atividades voltadas à construção de empreendimentos com unidades autônomas, com o objetivo de comercializá-las total ou parcialmente' },
    { value: 'loteamento', label: 'Loteamento', description: 'Atividades voltadas à divisão da área de um terreno em lotes destinados à edificação' },
    { value: 'aluguel', label: 'Imóvel para aluguel', description: 'Atividades voltadas à construção de imóveis com o objetivo de obter renda periódica' },
    { value: 'outro', label: 'Outro', description: 'Atividades não relacionadas com os segmentos anteriores' },
  ],
  agronegocio: [
    { value: 'producao_agricola', label: 'Produção Agrícola', description: 'Cultivo de grãos, hortaliças, frutas e culturas vegetais' },
    { value: 'pecuaria', label: 'Pecuária', description: 'Criação de gado, aves, suínos e outros animais' },
    { value: 'agroindustria', label: 'Agroindústria', description: 'Processamento e transformação de produtos agropecuários' },
    { value: 'agrotecnologia', label: 'Agrotecnologia', description: 'Soluções tecnológicas para agricultura' },
    { value: 'reflorestamento', label: 'Reflorestamento', description: 'Plantio comercial de eucalipto, pinus, etc.' },
    { value: 'outros', label: 'Outros', description: 'Outras atividades do agronegócio' },
  ],
  infraestrutura: [
    { value: 'energia_renovavel', label: 'Energia Renovável', description: 'Solar, eólica, biomassa' },
    { value: 'logistica', label: 'Logística e Transporte', description: 'Rodovias, ferrovias, portos, aeroportos' },
    { value: 'saneamento', label: 'Saneamento', description: 'Água, esgoto, resíduos' },
    { value: 'telecom', label: 'Telecomunicações', description: 'Fibra ótica, torres, data centers' },
    { value: 'mobilidade', label: 'Mobilidade Urbana', description: 'Metrô, BRT, VLT' },
    { value: 'outros', label: 'Outros', description: 'Outras atividades de infraestrutura' },
  ],
  tech: [
    { value: 'saas', label: 'SaaS', description: 'Plataformas em nuvem (Software as a Service)' },
    { value: 'fintech', label: 'Fintech', description: 'Soluções financeiras e pagamentos' },
    { value: 'ecommerce', label: 'E-commerce', description: 'Comércio eletrônico e marketplace' },
    { value: 'edtech', label: 'Edtech', description: 'Tecnologia para educação' },
    { value: 'healthtech', label: 'Healthtech', description: 'Soluções para saúde' },
    { value: 'agtech', label: 'Agtech', description: 'Tech para agronegócio' },
    { value: 'proptech', label: 'Proptech', description: 'Tech para imobiliário' },
    { value: 'outros', label: 'Outros', description: 'Outras startups de tecnologia' },
  ],
  negocios: [
    { value: 'varejo', label: 'Varejo', description: 'Lojas físicas e comércio' },
    { value: 'servicos', label: 'Serviços', description: 'Prestação de serviços' },
    { value: 'industria', label: 'Indústria', description: 'Manufatura e produção' },
    { value: 'franquias', label: 'Franquias', description: 'Redes de franquias' },
    { value: 'alimentacao', label: 'Alimentação', description: 'Restaurantes, bares, food service' },
    { value: 'outros', label: 'Outros', description: 'Outras atividades empresariais' },
  ],
  outros: [
    { value: 'ativos_judiciais', label: 'Ativos Judiciais', description: 'Precatórios, direitos creditórios' },
    { value: 'fundos', label: 'Fundos de Investimento', description: 'FII, FIP, FIDC, etc.' },
    { value: 'credito_estruturado', label: 'Crédito Estruturado', description: 'Operações de dívida, securitização' },
    { value: 'ma', label: 'M&A', description: 'Fusões e Aquisições' },
    { value: 'outros', label: 'Outros', description: 'Outras oportunidades de investimento' },
  ],
  _investidor_tese: [
    { value: 'imobiliario', label: 'Imobiliário', description: 'Teses focadas em incorporação, loteamento e multipropriedade' },
    { value: 'renda', label: 'Renda', description: 'Imóveis para geração de renda recorrente (aluguel)' },
    { value: 'desenvolvimento', label: 'Desenvolvimento', description: 'Projetos em fase de desenvolvimento ou pré-lançamento' },
    { value: 'diversificado', label: 'Diversificado', description: 'Sem preferência específica de segmento' },
  ],
};

export const STATUS_PROJETO = [
  { value: 'sem_terreno', label: 'Não, ainda não possuo terreno' },
  { value: 'com_terreno', label: 'Sim, mas a obra ainda não começou' },
  { value: 'obra_iniciada', label: 'Sim e a obra já foi iniciada' },
  { value: 'obra_finalizada', label: 'Sim, a construção já foi finalizada' },
];

export const TIPOS_PRODUTO = [
  { value: 'residencial_vertical', label: 'Residencial vertical' },
  { value: 'residencial_horizontal', label: 'Residencial horizontal' },
  { value: 'salas_comerciais', label: 'Salas comerciais' },
  { value: 'laje_corporativa', label: 'Laje corporativa' },
  { value: 'lojas', label: 'Lojas' },
  { value: 'multipropriedade', label: 'Multipropriedade' },
];

export const PUBLICOS_ALVO = [
  { value: 'baixa_renda', label: 'Baixa renda' },
  { value: 'media_renda', label: 'Média renda' },
  { value: 'alta_renda', label: 'Alta renda' },
];

// Agronegócio
export const TIPOS_PRODUCAO_AGRO = [
  { value: 'agricultura_precisao', label: 'Agricultura de precisão' },
  { value: 'producao_organica', label: 'Produção orgânica' },
  { value: 'cultivo_convencional', label: 'Cultivo convencional' },
  { value: 'agropecuaria_integrada', label: 'Agropecuária integrada' },
  { value: 'aquicultura', label: 'Aquicultura' },
  { value: 'outros', label: 'Outros' },
];

export const CERTIFICACOES_AGRO = [
  { value: 'organico', label: 'Orgânico' },
  { value: 'rainforest', label: 'Rainforest' },
  { value: 'fair_trade', label: 'Fair Trade' },
  { value: 'nenhuma', label: 'Nenhuma' },
];

export const INFRAESTRUTURA_OPTIONS = [
  { value: 'completa', label: 'Completa' },
  { value: 'parcial', label: 'Parcial' },
  { value: 'nao', label: 'Não possui' },
];

// Infraestrutura
export const TIPOS_PROJETO_INFRA = [
  { value: 'greenfield', label: 'Greenfield (novo)' },
  { value: 'brownfield', label: 'Brownfield (expansão)' },
  { value: 'concessao', label: 'Concessão' },
  { value: 'ppp', label: 'PPP' },
  { value: 'outros', label: 'Outros' },
];

export const ESTAGIOS_INFRA = [
  { value: 'estudos', label: 'Estudos' },
  { value: 'projeto_basico', label: 'Projeto básico' },
  { value: 'projeto_executivo', label: 'Projeto executivo' },
  { value: 'licencas', label: 'Licenças' },
  { value: 'execucao', label: 'Execução' },
];

export const TIPOS_RECEITA_INFRA = [
  { value: 'tarifa', label: 'Tarifa' },
  { value: 'contraprestacao', label: 'Contraprestação' },
  { value: 'acessorias', label: 'Receitas acessórias' },
  { value: 'misto', label: 'Misto' },
];

export const ABRANGENCIA_OPTIONS = [
  { value: 'municipal', label: 'Municipal' },
  { value: 'estadual', label: 'Estadual' },
  { value: 'regional', label: 'Regional' },
  { value: 'nacional', label: 'Nacional' },
  { value: 'internacional', label: 'Internacional' },
];

// Tech
export const MODELOS_NEGOCIO_TECH = [
  { value: 'b2b', label: 'B2B' },
  { value: 'b2c', label: 'B2C' },
  { value: 'b2b2c', label: 'B2B2C' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'saas_assinatura', label: 'SaaS por assinatura' },
  { value: 'licenciamento', label: 'Licenciamento' },
  { value: 'outros', label: 'Outros' },
];

export const ESTAGIOS_STARTUP = [
  { value: 'idea', label: 'Ideia/Pré-operacional' },
  { value: 'mvp', label: 'MVP desenvolvido' },
  { value: 'operando', label: 'Operando com clientes' },
  { value: 'crescimento', label: 'Crescimento' },
  { value: 'scaleup', label: 'Scale-up' },
  { value: 'consolidada', label: 'Consolidada' },
];

// Negócios
export const TIPOS_OPERACAO_NEGOCIOS = [
  { value: 'expansao', label: 'Expansão de negócio existente' },
  { value: 'novo', label: 'Novo negócio' },
  { value: 'aquisicao', label: 'Aquisição' },
  { value: 'reestruturacao', label: 'Reestruturação' },
  { value: 'fusao', label: 'Fusão' },
  { value: 'outros', label: 'Outros' },
];

export const TEMPO_OPERACAO_OPTIONS = [
  { value: 'menos_1', label: 'Menos de 1 ano' },
  { value: '1_3', label: '1 a 3 anos' },
  { value: '3_5', label: '3 a 5 anos' },
  { value: '5_10', label: '5 a 10 anos' },
  { value: 'mais_10', label: 'Mais de 10 anos' },
];

export const FAIXAS_FATURAMENTO = [
  { value: 'ate_360k', label: 'Até R$ 360 mil' },
  { value: '360k_4.8m', label: 'R$ 360 mil a R$ 4,8 milhões' },
  { value: '4.8m_300m', label: 'R$ 4,8 milhões a R$ 300 milhões' },
  { value: 'mais_300m', label: 'Mais de R$ 300 milhões' },
];

export const FINALIDADES_INVESTIMENTO = [
  { value: 'expansao', label: 'Expansão' },
  { value: 'capital_giro', label: 'Capital de giro' },
  { value: 'reestruturacao', label: 'Reestruturação' },
  { value: 'equipamentos', label: 'Equipamentos' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'outros', label: 'Outros' },
];

// Outros
export const TIPOS_ATIVOS_JUDICIAIS = [
  { value: 'precatorio_federal', label: 'Precatório Federal' },
  { value: 'precatorio_estadual', label: 'Precatório Estadual' },
  { value: 'precatorio_municipal', label: 'Precatório Municipal' },
  { value: 'direito_creditorio', label: 'Direito Creditório' },
  { value: 'outros', label: 'Outros' },
];

export const TIPOS_FUNDOS = [
  { value: 'fii', label: 'FII - Fundo de Investimento Imobiliário' },
  { value: 'fip', label: 'FIP - Fundo de Investimento em Participações' },
  { value: 'fidc', label: 'FIDC - Fundo de Direitos Creditórios' },
  { value: 'fiagro', label: 'FIAGRO' },
  { value: 'outros', label: 'Outros' },
];

// Field tooltips
export const FIELD_TOOLTIPS: Record<string, string> = {
  vgvEstimado: 'VGV (Valor Geral de Vendas) é o valor total esperado da venda de todas as unidades do empreendimento.',
  tirProjetada: 'TIR (Taxa Interna de Retorno) é a taxa de desconto que iguala o valor presente dos fluxos de caixa ao investimento inicial.',
  ticketMinimo: 'Valor mínimo que cada investidor precisa aportar para participar da operação.',
  ebitda: 'EBITDA (Lucros antes de juros, impostos, depreciação e amortização) representa o resultado operacional da empresa.',
  margemEbitda: 'Margem EBITDA é a relação entre o EBITDA e a receita líquida, expressa em percentual.',
  ltv: 'LTV (Lifetime Value) é a receita média gerada por um cliente durante todo o período de relacionamento.',
  cac: 'CAC (Custo de Aquisição de Cliente) é o custo médio para adquirir um novo cliente.',
  mrr: 'MRR (Monthly Recurring Revenue) é a receita mensal recorrente proveniente de assinaturas.',
  arr: 'ARR (Annual Recurring Revenue) é a receita anual recorrente, calculada como MRR × 12.',
  churn: 'Taxa de cancelamento de clientes em um período, geralmente expressa em percentual mensal.',
  runway: 'Tempo (em meses) que a empresa consegue operar com o caixa atual, sem novas receitas.',
  breakeven: 'Ponto de equilíbrio, momento em que as receitas igualam os custos operacionais.',
  capex: 'CAPEX (Capital Expenditure) são os gastos com bens de capital, como equipamentos e instalações.',
  opex: 'OPEX (Operational Expenditure) são os gastos operacionais recorrentes para manter o negócio.',
  payback: 'Tempo necessário para recuperar o investimento inicial através dos fluxos de caixa.',
  valuation: 'Valor estimado da empresa, geralmente calculado por múltiplos ou fluxo de caixa descontado.',
  tam: 'TAM (Total Addressable Market) é o tamanho total do mercado potencial.',
  sam: 'SAM (Serviceable Available Market) é a parcela do TAM que sua empresa pode atender.',
  diluicao: 'Percentual de participação societária oferecido em troca do investimento.',
  deságio: 'Diferença percentual entre o valor de face e o valor de compra de um ativo.',
};
