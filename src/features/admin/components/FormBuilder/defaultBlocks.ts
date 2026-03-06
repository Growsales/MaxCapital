/**
 * Default form blocks per sector - auto-seeded when a segment has no blocks yet.
 * Uses 'section' blocks to split forms into navigable steps/screens.
 */
import type { FormBlock, BlockOption } from './types';
import { generateBlockId } from './types';
import {
  STATUS_PROJETO,
  TIPOS_PRODUCAO_AGRO,
  TIPOS_PROJETO_INFRA,
  MODELOS_NEGOCIO_TECH,
  ESTAGIOS_STARTUP,
  TIPOS_OPERACAO_NEGOCIOS,
  ABRANGENCIA_OPTIONS,
  TIPOS_PRODUTO,
  PUBLICOS_ALVO,
  TEMPO_OPERACAO_OPTIONS,
  FAIXAS_FATURAMENTO,
  CERTIFICACOES_AGRO,
  INFRAESTRUTURA_OPTIONS,
  ESTAGIOS_INFRA,
  TIPOS_RECEITA_INFRA,
  TIPOS_ATIVOS_JUDICIAIS,
  TIPOS_FUNDOS,
  FINALIDADES_INVESTIMENTO,
} from '@/features/operations/components/NewDealWizard/types';

function opt(items: { value: string; label: string }[]): BlockOption[] {
  return items.map(i => ({ value: i.value, label: i.label }));
}

function b(partial: Partial<FormBlock> & { label: string; type: FormBlock['type']; category: FormBlock['category'] }): FormBlock {
  return {
    id: generateBlockId(),
    width: 'full',
    ativo: true,
    ...partial,
  };
}

// ─── Section divider ────────────────────────────────────────────────────────
const secao = (label: string) => b({ label, type: 'section', category: 'content', content: label });

// ─── Common reusable blocks ─────────────────────────────────────────────────
const nomeProjeto = () => b({ label: 'Qual o nome do projeto?', type: 'text', category: 'field', placeholder: 'Ex: Residencial Parque das Flores', required: true, helpText: 'Nome comercial ou interno do projeto' });
const cnpjBlock = () => b({ label: 'CNPJ da empresa responsável', type: 'cnpj', category: 'field', placeholder: '00.000.000/0000-00', required: true });
const descricaoBlock = () => b({ label: 'Descreva brevemente o projeto', type: 'textarea', category: 'field', placeholder: 'Conte-nos sobre o projeto, seus diferenciais e objetivos...', required: true });
const cepBlock = () => b({ label: 'CEP do empreendimento', type: 'cep', category: 'field', placeholder: '00000-000', required: true, helpText: 'Informe o CEP para localização' });
const cidadeBlock = () => b({ label: 'Cidade', type: 'text', category: 'field', placeholder: 'Preenchido automaticamente', width: 'half' });
const ufBlock = () => b({ label: 'Estado (UF)', type: 'text', category: 'field', placeholder: 'UF', width: 'half' });
const investimentoBlock = () => b({ label: 'Quanto de investimento você busca captar?', type: 'currency', category: 'field', placeholder: 'R$ 0,00', required: true, helpText: 'Valor total que deseja captar' });
const ticketBlock = () => b({ label: 'Qual o ticket mínimo por investidor?', type: 'currency', category: 'field', placeholder: 'R$ 0,00', width: 'half', helpText: 'Valor mínimo de entrada' });
const tirBlock = () => b({ label: 'Qual a TIR projetada?', type: 'text', category: 'field', placeholder: 'Ex: 15% a.a.', width: 'half', helpText: 'Taxa Interna de Retorno esperada' });
const prazoBlock = () => b({ label: 'Qual o prazo da operação?', type: 'text', category: 'field', placeholder: 'Ex: 24 meses', width: 'half' });
const retornoBlock = () => b({ label: 'Retorno esperado para o investidor', type: 'text', category: 'field', placeholder: 'Ex: 18% a.a.', width: 'half' });
const observacoesBlock = () => b({ label: 'Observações adicionais', type: 'textarea', category: 'field', placeholder: 'Informações complementares, garantias, diferenciais...' });
const googleDriveBlock = () => b({ label: 'Link do material complementar (Google Drive, etc)', type: 'text', category: 'field', placeholder: 'https://drive.google.com/...', helpText: 'Compartilhe documentos, apresentações, planilhas' });

// ─── IMOBILIÁRIO ────────────────────────────────────────────────────────────

function imobiliarioBlocks(): FormBlock[] {
  return [
    secao('Tipo do Projeto'),
    b({ label: 'Qual o status atual do projeto?', type: 'select', category: 'field', required: true, options: opt(STATUS_PROJETO), helpText: 'Informe o estágio atual do empreendimento' }),
    b({ label: 'Qual é o produto desse empreendimento?', type: 'multiselect', category: 'field', options: opt(TIPOS_PRODUTO), required: true, helpText: 'Você pode selecionar mais de uma opção' }),
    b({ label: 'Qual o público-alvo desse imóvel?', type: 'multiselect', category: 'field', options: opt(PUBLICOS_ALVO), required: true, helpText: 'Você pode selecionar mais de uma opção' }),

    secao('Localização'),
    cepBlock(),
    cidadeBlock(),
    ufBlock(),

    secao('Dados Financeiros'),
    b({ label: 'Qual o VGV estimado?', type: 'currency', category: 'field', placeholder: 'R$ 0,00', required: true, helpText: 'Valor Geral de Vendas estimado do empreendimento' }),
    investimentoBlock(),
    ticketBlock(),
    tirBlock(),
    prazoBlock(),
    retornoBlock(),

    secao('Detalhes do Empreendimento'),
    b({ label: 'Área do terreno (m²)', type: 'number', category: 'field', placeholder: 'Ex: 5000', width: 'half' }),
    b({ label: 'Área construída (m²)', type: 'number', category: 'field', placeholder: 'Ex: 12000', width: 'half' }),
    b({ label: 'Número de unidades', type: 'number', category: 'field', placeholder: 'Ex: 120', width: 'half' }),
    b({ label: 'Área média por unidade (m²)', type: 'number', category: 'field', placeholder: 'Ex: 65', width: 'half' }),
    b({ label: 'Custo total da obra', type: 'currency', category: 'field', placeholder: 'R$ 0,00', width: 'half' }),
    b({ label: 'Margem de lucro esperada (%)', type: 'text', category: 'field', placeholder: 'Ex: 25%', width: 'half' }),

    secao('Cronograma e Documentação'),
    b({ label: 'Data prevista de início', type: 'date', category: 'field', width: 'half' }),
    b({ label: 'Data prevista de conclusão', type: 'date', category: 'field', width: 'half' }),
    b({ label: 'Status das aprovações', type: 'text', category: 'field', placeholder: 'Ex: Alvará aprovado, RI em andamento...' }),
    googleDriveBlock(),
    observacoesBlock(),
  ];
}

// ─── AGRONEGÓCIO ────────────────────────────────────────────────────────────

function agronegocioBlocks(): FormBlock[] {
  return [
    secao('Tipo de Produção'),
    b({ label: 'Qual o tipo de produção?', type: 'select', category: 'field', required: true, options: opt(TIPOS_PRODUCAO_AGRO) }),
    b({ label: 'Qual a cultura ou atividade principal?', type: 'text', category: 'field', placeholder: 'Ex: Soja, Café, Gado de corte...', required: true }),
    b({ label: 'Possui certificações?', type: 'multiselect', category: 'field', options: opt(CERTIFICACOES_AGRO), helpText: 'Selecione todas as certificações aplicáveis' }),
    b({ label: 'Infraestrutura instalada', type: 'select', category: 'field', options: opt(INFRAESTRUTURA_OPTIONS) }),

    secao('Localização da Propriedade'),
    cepBlock(),
    cidadeBlock(),
    ufBlock(),
    b({ label: 'Tamanho total da propriedade (hectares)', type: 'number', category: 'field', placeholder: 'Ex: 500', required: true, width: 'half' }),
    b({ label: 'Área produtiva (hectares)', type: 'number', category: 'field', placeholder: 'Ex: 350', width: 'half' }),
    b({ label: 'Tipo de solo', type: 'text', category: 'field', placeholder: 'Ex: Latossolo vermelho', width: 'half' }),
    b({ label: 'Fonte de água', type: 'text', category: 'field', placeholder: 'Ex: Rio, poço artesiano', width: 'half' }),

    secao('Dados Financeiros'),
    investimentoBlock(),
    ticketBlock(),
    tirBlock(),
    prazoBlock(),
    b({ label: 'Receita anual estimada', type: 'currency', category: 'field', placeholder: 'R$ 0,00', width: 'half' }),
    b({ label: 'Produtividade esperada', type: 'text', category: 'field', placeholder: 'Ex: 60 sacas/hectare', width: 'half' }),
    retornoBlock(),

    secao('Detalhes Operacionais'),
    b({ label: 'Ciclo de produção', type: 'text', category: 'field', placeholder: 'Ex: Safra anual, Bienal...', width: 'half' }),
    b({ label: 'Capacidade anual de produção', type: 'text', category: 'field', placeholder: 'Ex: 10.000 toneladas', width: 'half' }),
    b({ label: 'Mercado-alvo', type: 'text', category: 'field', placeholder: 'Ex: Exportação, mercado interno...' }),
    googleDriveBlock(),
    observacoesBlock(),
  ];
}

// ─── INFRAESTRUTURA ─────────────────────────────────────────────────────────

function infraestruturaBlocks(): FormBlock[] {
  return [
    secao('Tipo do Projeto'),
    b({ label: 'Qual o tipo de projeto?', type: 'select', category: 'field', required: true, options: opt(TIPOS_PROJETO_INFRA) }),
    b({ label: 'Em que estágio se encontra?', type: 'select', category: 'field', options: opt(ESTAGIOS_INFRA), required: true }),
    b({ label: 'Qual o modelo de receita?', type: 'select', category: 'field', options: opt(TIPOS_RECEITA_INFRA) }),

    secao('Localização e Abrangência'),
    cepBlock(),
    cidadeBlock(),
    ufBlock(),
    b({ label: 'Qual a abrangência do projeto?', type: 'select', category: 'field', required: true, options: opt(ABRANGENCIA_OPTIONS) }),
    b({ label: 'Estados atendidos', type: 'text', category: 'field', placeholder: 'Ex: SP, RJ, MG' }),

    secao('Dados Financeiros'),
    investimentoBlock(),
    ticketBlock(),
    tirBlock(),
    prazoBlock(),
    b({ label: 'CAPEX total', type: 'currency', category: 'field', placeholder: 'R$ 0,00', width: 'half', helpText: 'Investimento em bens de capital' }),
    b({ label: 'OPEX anual estimado', type: 'currency', category: 'field', placeholder: 'R$ 0,00', width: 'half', helpText: 'Despesas operacionais anuais' }),
    b({ label: 'Payback estimado', type: 'text', category: 'field', placeholder: 'Ex: 7 anos', width: 'half' }),
    b({ label: 'Receita anual projetada', type: 'currency', category: 'field', placeholder: 'R$ 0,00', width: 'half' }),
    retornoBlock(),

    secao('Detalhes Técnicos'),
    b({ label: 'Extensão/Capacidade do projeto', type: 'text', category: 'field', placeholder: 'Ex: 150 MW, 200 km de rodovia...' }),
    b({ label: 'Tecnologia utilizada', type: 'text', category: 'field', placeholder: 'Ex: Painéis bifaciais, turbinas de 5MW...' }),
    b({ label: 'Vida útil estimada', type: 'text', category: 'field', placeholder: 'Ex: 25 anos', width: 'half' }),
    b({ label: 'Capacidade de atendimento', type: 'text', category: 'field', placeholder: 'Ex: 500 mil pessoas', width: 'half' }),

    secao('Regulatório e Documentação'),
    b({ label: 'Órgão regulador', type: 'text', category: 'field', placeholder: 'Ex: ANEEL, ANTT, ANA...', width: 'half' }),
    b({ label: 'Status regulatório', type: 'text', category: 'field', placeholder: 'Ex: Licença ambiental obtida', width: 'half' }),
    b({ label: 'Nº da concessão/autorização', type: 'text', category: 'field', placeholder: 'Se aplicável', width: 'half' }),
    b({ label: 'Prazo da concessão (anos)', type: 'number', category: 'field', placeholder: 'Ex: 30', width: 'half' }),
    googleDriveBlock(),
    observacoesBlock(),
  ];
}

// ─── TECH / STARTUPS ────────────────────────────────────────────────────────

function techBlocks(): FormBlock[] {
  return [
    secao('Modelo e Estágio'),
    b({ label: 'Qual o modelo de negócio?', type: 'select', category: 'field', required: true, options: opt(MODELOS_NEGOCIO_TECH) }),
    b({ label: 'Em que estágio a startup está?', type: 'select', category: 'field', required: true, options: opt(ESTAGIOS_STARTUP) }),
    b({ label: 'Qual o diferencial competitivo?', type: 'textarea', category: 'field', placeholder: 'O que torna sua solução única no mercado?', required: true }),
    b({ label: 'Quais os principais concorrentes?', type: 'text', category: 'field', placeholder: 'Ex: Empresa A, Empresa B...' }),

    secao('Métricas de Tração'),
    b({ label: 'Possui clientes pagantes?', type: 'checkbox', category: 'field' }),
    b({ label: 'Quantidade de clientes ativos', type: 'number', category: 'field', placeholder: 'Ex: 150', width: 'half' }),
    b({ label: 'Usuários ativos mensais', type: 'number', category: 'field', placeholder: 'Ex: 5000', width: 'half' }),
    b({ label: 'MRR atual (receita recorrente mensal)', type: 'currency', category: 'field', placeholder: 'R$ 0,00', width: 'half', helpText: 'Monthly Recurring Revenue' }),
    b({ label: 'ARR anualizado', type: 'currency', category: 'field', placeholder: 'R$ 0,00', width: 'half', helpText: 'Annual Recurring Revenue' }),
    b({ label: 'Taxa de churn mensal', type: 'text', category: 'field', placeholder: 'Ex: 3%', width: 'half' }),
    b({ label: 'LTV (valor vitalício do cliente)', type: 'currency', category: 'field', placeholder: 'R$ 0,00', width: 'half' }),
    b({ label: 'CAC (custo de aquisição)', type: 'currency', category: 'field', placeholder: 'R$ 0,00', width: 'half' }),

    secao('Investimento e Valuation'),
    b({ label: 'TAM (mercado total endereçável)', type: 'currency', category: 'field', placeholder: 'R$ 0,00', helpText: 'Total Addressable Market' }),
    b({ label: 'Valuation atual', type: 'currency', category: 'field', placeholder: 'R$ 0,00', width: 'half' }),
    investimentoBlock(),
    ticketBlock(),
    b({ label: 'Diluição oferecida (%)', type: 'text', category: 'field', placeholder: 'Ex: 10%', width: 'half' }),
    b({ label: 'Já captou investimento antes?', type: 'currency', category: 'field', placeholder: 'R$ 0,00', width: 'half', helpText: 'Valor total já captado' }),
    b({ label: 'Runway atual (meses)', type: 'number', category: 'field', placeholder: 'Ex: 18', width: 'half' }),
    b({ label: 'Previsão de breakeven', type: 'text', category: 'field', placeholder: 'Ex: Q3 2025', width: 'half' }),

    secao('Equipe e Produto'),
    b({ label: 'Stack tecnológica', type: 'text', category: 'field', placeholder: 'Ex: React, Node.js, AWS, PostgreSQL...' }),
    b({ label: 'Founders (nomes e perfis)', type: 'textarea', category: 'field', placeholder: 'Descreva os fundadores, experiência e papéis...' }),
    b({ label: 'Advisors / Board', type: 'text', category: 'field', placeholder: 'Nomes e perfis dos conselheiros' }),
    b({ label: 'Número de funcionários', type: 'number', category: 'field', placeholder: 'Ex: 15', width: 'half' }),
    b({ label: 'Link do produto / demo', type: 'text', category: 'field', placeholder: 'https://...', width: 'half' }),
    googleDriveBlock(),
    observacoesBlock(),
  ];
}

// ─── NEGÓCIOS ───────────────────────────────────────────────────────────────

function negociosBlocks(): FormBlock[] {
  return [
    secao('Tipo e Histórico'),
    b({ label: 'Qual o tipo de operação?', type: 'select', category: 'field', required: true, options: opt(TIPOS_OPERACAO_NEGOCIOS) }),
    b({ label: 'Há quanto tempo opera?', type: 'select', category: 'field', options: opt(TEMPO_OPERACAO_OPTIONS), required: true }),
    b({ label: 'Ano de fundação', type: 'number', category: 'field', placeholder: 'Ex: 2015', width: 'half' }),
    b({ label: 'Faixa de faturamento', type: 'select', category: 'field', options: opt(FAIXAS_FATURAMENTO), required: true }),

    secao('Localização e Estrutura'),
    cepBlock(),
    cidadeBlock(),
    ufBlock(),
    b({ label: 'Possui múltiplas unidades?', type: 'checkbox', category: 'field' }),
    b({ label: 'Quantidade de unidades', type: 'number', category: 'field', placeholder: 'Ex: 5', width: 'half' }),
    b({ label: 'Número de funcionários', type: 'number', category: 'field', placeholder: 'Ex: 50', width: 'half' }),
    b({ label: 'Estados de atuação', type: 'text', category: 'field', placeholder: 'Ex: SP, RJ, MG' }),

    secao('Dados Financeiros'),
    b({ label: 'Faturamento anual', type: 'currency', category: 'field', placeholder: 'R$ 0,00', required: true, width: 'half' }),
    b({ label: 'EBITDA', type: 'currency', category: 'field', placeholder: 'R$ 0,00', width: 'half', helpText: 'Lucro antes de juros, impostos, depreciação e amortização' }),
    b({ label: 'Margem EBITDA (%)', type: 'text', category: 'field', placeholder: 'Ex: 20%', width: 'half' }),
    b({ label: 'Dívida atual', type: 'currency', category: 'field', placeholder: 'R$ 0,00', width: 'half' }),
    investimentoBlock(),
    ticketBlock(),
    tirBlock(),
    prazoBlock(),
    retornoBlock(),

    secao('Finalidade e Documentação'),
    b({ label: 'Para que será usado o investimento?', type: 'multiselect', category: 'field', options: opt(FINALIDADES_INVESTIMENTO), required: true, helpText: 'Selecione todos os que se aplicam' }),
    googleDriveBlock(),
    observacoesBlock(),
  ];
}

// ─── INVESTIDOR TESE ────────────────────────────────────────────────────────

function investidorTeseBlocks(): FormBlock[] {
  return [
    secao('Perfil do Investidor'),
    b({ label: 'Qual o seu perfil de investidor?', type: 'select', category: 'field', required: true, options: [
      { value: 'arrojado', label: 'Arrojado' },
      { value: 'moderado', label: 'Moderado' },
      { value: 'conservador', label: 'Conservador' },
    ], helpText: 'Selecione o perfil que melhor representa sua tolerância a risco' }),
    b({ label: 'Já é investidor qualificado?', type: 'select', category: 'field', required: true, options: [
      { value: 'sim_patrimonio', label: 'Sim, possuo R$1 milhão investido' },
      { value: 'sim_certificacao', label: 'Sim, possuo certificação do mercado financeiro' },
      { value: 'nao', label: 'Não' },
    ], helpText: 'Investidor qualificado: possui R$1 milhão investido ou certificação do mercado financeiro' }),

    secao('Experiência e Expectativas'),
    b({ label: 'Há quanto tempo investe no mercado imobiliário?', type: 'select', category: 'field', required: true, options: [
      { value: 'nunca', label: 'Nunca investi' },
      { value: 'menos_1', label: 'Menos de 1 ano' },
      { value: '1_3', label: '1 a 3 anos' },
      { value: '3_5', label: '3 a 5 anos' },
      { value: '5_10', label: '5 a 10 anos' },
      { value: 'mais_10', label: 'Mais de 10 anos' },
    ] }),
    b({ label: 'Quanto está disposto a investir?', type: 'currency', category: 'field', placeholder: 'R$ 0,00', required: true, helpText: 'Valor total que pretende alocar' }),
    b({ label: 'Quanto espera de rentabilidade ao ano?', type: 'select', category: 'field', required: true, options: [
      { value: 'ate_8', label: 'Até 8% a.a.' },
      { value: '8_12', label: '8% a 12% a.a.' },
      { value: '12_18', label: '12% a 18% a.a.' },
      { value: '18_25', label: '18% a 25% a.a.' },
      { value: 'acima_25', label: 'Acima de 25% a.a.' },
    ] }),
    b({ label: 'Quantos anos está disposto a esperar para resgatar o investimento?', type: 'select', category: 'field', required: true, options: [
      { value: 'ate_1', label: 'Até 1 ano' },
      { value: '1_2', label: '1 a 2 anos' },
      { value: '2_3', label: '2 a 3 anos' },
      { value: '3_5', label: '3 a 5 anos' },
      { value: 'mais_5', label: 'Mais de 5 anos' },
    ] }),

    secao('Preferências de Investimento'),
    b({ label: 'Em que fase do projeto prefere entrar?', type: 'select', category: 'field', required: true, options: [
      { value: 'desenvolvimento', label: 'No desenvolvimento' },
      { value: 'apos_aprovacao', label: 'Só após aprovação' },
      { value: 'lancamento', label: 'No lançamento' },
      { value: 'apos_lancamento', label: 'Após lançamento' },
    ] }),
    b({ label: 'Preferência de Tipologia', type: 'select', category: 'field', required: true, options: [
      { value: 'loteamento', label: 'Loteamento' },
      { value: 'incorporacao_vertical', label: 'Incorporação vertical' },
      { value: 'multipropriedade', label: 'Multipropriedade' },
      { value: 'sem_preferencia', label: 'Não tenho preferência, só olho rentabilidade' },
    ] }),
    b({ label: 'Preferência de Padrão', type: 'select', category: 'field', required: true, options: [
      { value: 'alto', label: 'Alto padrão' },
      { value: 'medio', label: 'Médio padrão' },
      { value: 'popular', label: 'Popular' },
      { value: 'sem_preferencia', label: 'Não tenho preferência, só olho rentabilidade' },
    ] }),

    secao('Perfil da Empresa Alvo'),
    b({ label: 'Setores de interesse', type: 'multiselect', category: 'field', required: true, options: [
      { value: 'imobiliario', label: 'Imobiliário' },
      { value: 'infraestrutura', label: 'Infraestrutura' },
      { value: 'saneamento', label: 'Saneamento' },
      { value: 'energia', label: 'Energia' },
      { value: 'agronegocio', label: 'Agronegócio' },
      { value: 'tecnologia', label: 'Tecnologia' },
      { value: 'saude', label: 'Saúde' },
      { value: 'educacao', label: 'Educação' },
      { value: 'governo', label: 'Governo' },
      { value: 'varejo', label: 'Varejo' },
    ], helpText: 'Selecione todos os setores de interesse' }),
    b({ label: 'Modelo de negócio preferido', type: 'select', category: 'field', options: [
      { value: 'b2b', label: 'B2B' },
      { value: 'b2c', label: 'B2C' },
      { value: 'b2g', label: 'B2G (Governo)' },
      { value: 'b2b2c', label: 'B2B2C' },
      { value: 'marketplace', label: 'Marketplace' },
      { value: 'sem_preferencia', label: 'Sem preferência' },
    ] }),
    b({ label: 'Fase de investimento', type: 'select', category: 'field', options: [
      { value: 'greenfield', label: 'Greenfield' },
      { value: 'brownfield', label: 'Brownfield' },
      { value: 'greenfield_brownfield', label: 'Greenfield / Brownfield' },
      { value: 'operacional', label: 'Operacional (já em funcionamento)' },
    ] }),
    b({ label: 'Público-alvo da empresa', type: 'select', category: 'field', options: [
      { value: 'b2b_enterprise', label: 'B2B / Enterprise' },
      { value: 'b2c_massa', label: 'B2C / Massa' },
      { value: 'governo', label: 'Governo / Setor público' },
      { value: 'misto', label: 'Misto' },
    ] }),
    b({ label: 'Informações adicionais sobre empresa alvo', type: 'textarea', category: 'field', placeholder: 'Ex: Preferência por empresas com EBITDA positivo, interesse em sinergias operacionais...', helpText: 'Descreva características desejadas nas empresas' }),

    secao('Perfil da Transação'),
    b({ label: 'Tipo de participação desejada', type: 'multiselect', category: 'field', required: true, options: [
      { value: 'total', label: 'Total (100%) - Aquisição completa' },
      { value: 'majoritaria', label: 'Majoritária (>51%) - Controle majoritário' },
      { value: 'minoritaria', label: 'Minoritária (<49%) - Participação minoritária' },
    ], helpText: 'Selecione os tipos de participação que aceita' }),

    secao('Requisitos Financeiros'),
    b({ label: 'Receita bruta anual mínima', type: 'currency', category: 'field', placeholder: 'R$ 0,00', width: 'half', helpText: 'Faturamento mínimo desejado da empresa' }),
    b({ label: 'Receita bruta anual máxima', type: 'currency', category: 'field', placeholder: 'R$ 0,00', width: 'half', helpText: 'Faturamento máximo desejado' }),
    b({ label: 'EBITDA anual mínimo', type: 'currency', category: 'field', placeholder: 'R$ 0,00', width: 'half' }),
    b({ label: 'EBITDA anual máximo', type: 'currency', category: 'field', placeholder: 'R$ 0,00', width: 'half', helpText: 'Deixe vazio para "sem limite"' }),
    b({ label: 'Valor mínimo do investimento', type: 'currency', category: 'field', placeholder: 'R$ 0,00', required: true, width: 'half', helpText: 'Ticket mínimo que pretende investir' }),
    b({ label: 'Valor máximo do investimento', type: 'currency', category: 'field', placeholder: 'R$ 0,00', required: true, width: 'half', helpText: 'Ticket máximo que pretende investir' }),

    secao('Regiões e Observações'),
    b({ label: 'Regiões de atuação', type: 'multiselect', category: 'field', required: true, options: [
      { value: 'norte', label: 'Norte' },
      { value: 'nordeste', label: 'Nordeste' },
      { value: 'centro_oeste', label: 'Centro-Oeste' },
      { value: 'sudeste', label: 'Sudeste' },
      { value: 'sul', label: 'Sul' },
    ], helpText: 'Onde a empresa alvo deve atuar' }),
    b({ label: 'Comentários gerais', type: 'textarea', category: 'field', placeholder: 'Compartilhe informações adicionais, expectativas, restrições ou qualquer outro detalhe relevante...', helpText: 'Campo opcional para observações complementares' }),
  ];
}

// ─── OUTROS (Ativos Judiciais, Fundos, Crédito, M&A) ───────────────────────

function outrosBlocks(): FormBlock[] {
  return [
    secao('Classificação'),
    b({ label: 'Tipo de ativo judicial', type: 'select', category: 'field', options: opt(TIPOS_ATIVOS_JUDICIAIS), helpText: 'Se aplicável' }),
    b({ label: 'Tipo de fundo', type: 'select', category: 'field', options: opt(TIPOS_FUNDOS), helpText: 'Se aplicável' }),

    secao('Dados Financeiros'),
    b({ label: 'Valor total do ativo', type: 'currency', category: 'field', placeholder: 'R$ 0,00', required: true }),
    investimentoBlock(),
    ticketBlock(),
    tirBlock(),
    prazoBlock(),
    retornoBlock(),

    secao('Detalhes e Documentação'),
    b({ label: 'Garantias oferecidas', type: 'textarea', category: 'field', placeholder: 'Descreva as garantias da operação...' }),
    googleDriveBlock(),
    observacoesBlock(),
  ];
}

// ─── Public API ─────────────────────────────────────────────────────────────

const SECTOR_DEFAULTS: Record<string, () => FormBlock[]> = {
  imobiliario: imobiliarioBlocks,
  agronegocio: agronegocioBlocks,
  infraestrutura: infraestruturaBlocks,
  tech: techBlocks,
  negocios: negociosBlocks,
  outros: outrosBlocks,
  _investidor_tese: investidorTeseBlocks,
};

/**
 * Get default blocks for a sector. Used to seed forms for all segments.
 * Returns a new array with fresh IDs each time.
 */
export function getDefaultBlocksForSector(setor: string): FormBlock[] {
  const factory = SECTOR_DEFAULTS[setor];
  if (!factory) return [observacoesBlock()];
  return factory();
}

/**
 * Ensure blocks exist in localStorage for a given setor/segmento.
 * If empty, seeds with sector defaults. Returns the blocks.
 */
export function ensureBlocksExist(setor: string, segmento: string): FormBlock[] {
  const key = `form-blocks-${setor}-${segmento}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const blocks = JSON.parse(raw) as FormBlock[];
      if (blocks.length > 0) return blocks;
    }
  } catch { /* ignore */ }

  const defaults = getDefaultBlocksForSector(setor);
  localStorage.setItem(key, JSON.stringify(defaults));
  return defaults;
}
