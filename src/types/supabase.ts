/**
 * Database-style types (snake_case) matching mock data shape.
 * This is the canonical type source for the application.
 */

// User Types
export type UserType = 'parceiro' | 'empresa' | 'investidor' | 'admin' | 'master';
export type UserStatus = 'ativo' | 'inativo' | 'pendente_aprovacao';

export interface Profile {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  tipo: UserType;
  avatar_url?: string | null;
  status: UserStatus;
  codigo_convite_proprio?: string;
  indicado_por_id?: string | null;
  total_indicacoes_diretas?: number;
  total_indicacoes_indiretas?: number;
  created_at: string;
  updated_at: string;
}

// Company Types
export type Segmento = 'Startups' | 'Comercial' | 'Agronegócio' | 'Imobiliário' | 'Energia' | 'Ativos judiciais' | 'Outros';
export type TipoOperacao = 'Investimento' | 'Crédito' | 'Expansão' | 'Incorporação' | 'Financiamento';
export type StatusCadastro = 'completo' | 'incompleto';

export interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  nome_fantasia?: string;
  segmento: Segmento;
  responsavel_id: string;
  contato_email: string;
  telefone?: string;
  endereco_cep?: string;
  endereco_logradouro?: string;
  endereco_numero?: string;
  endereco_complemento?: string | null;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_uf?: string;
  status_cadastro: StatusCadastro;
  valor_operacao: number;
  tipo_operacao: TipoOperacao;
  status_exclusividade?: StatusExclusividade;
  data_exclusividade?: string | null;
  logo_url?: string | null;
  created_at: string;
  updated_at: string;
  criado_por_id: string;
  responsavel?: { nome: string; email: string };
}

// Pipeline Types
export type EtapaPipeline =
  | 'Prospecto'
  | 'Comitê'
  | 'Comercial'
  | 'Cliente Ativo'
  | 'Estruturação'
  | 'Matchmaking'
  | 'Apresentação'
  | 'Negociação'
  | 'Concluído';

export type LeadTag = 'frio' | 'morno' | 'quente' | 'convertido';
export type TipoCapital = 'Captação' | 'Investimento' | 'Híbrido';
export type StatusExclusividade = 'Ativo' | 'Vencido' | 'Sem exclusividade';
export type Office = 'Centro-Oeste' | 'Norte' | 'Sul' | 'Sudeste' | 'Nordeste';

export interface Operacao {
  id: string;
  numero_funil: string;
  empresa_id: string;
  empresa?: { id: string; nome: string; cnpj?: string; segmento?: string };
  etapa_atual: EtapaPipeline;
  sub_etapa?: string | null;
  valor_investimento: number;
  tipo_capital: TipoCapital;
  segmento: Segmento;
  responsavel_id: string;
  responsavel?: { id: string; nome: string; email: string; avatar_url?: string | null };
  office: Office;
  lead_tag: LeadTag;
  status_exclusividade: StatusExclusividade;
  data_exclusividade?: string | null;
  dias_na_etapa: number;
  dias_desde_atualizacao: number;
  created_at: string;
  ultima_movimentacao: string;
  observacoes?: string | null;
  ativo?: boolean;
}

// Movement History
export interface MovimentacaoHistorico {
  id: string;
  operacao_id: string;
  usuario_id: string;
  usuario?: Profile;
  etapa_anterior: EtapaPipeline;
  sub_etapa_anterior?: string;
  etapa_nova: EtapaPipeline;
  sub_etapa_nova?: string;
  data_hora: string;
  observacoes?: string;
}

// Notification Types
export type TipoNotificacao = 'sistema' | 'whatsapp' | 'email' | 'push';
export type StatusNotificacao = 'enviada' | 'lida' | 'erro';

export interface Notificacao {
  id: string;
  destinatario_id: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  operacao_id?: string;
  status: StatusNotificacao;
  created_at: string;
  lida_em?: string;
}

// Network/Rede Types
export interface MembroRede {
  id: string;
  indicacao: 'Direta' | 'Indireta';
  nivel: string;
  nome: string;
  numero_negocios: number;
  valor_total: number;
  ultimo_negocio: string;
  status: 'Ativo' | 'Inativo';
}

// Stats Types
export interface DashboardStats {
  totalNegocios: number;
  valorTotal: number;
  negociosConcluidos: number;
  taxaConversao: number;
  changeTotalNegocios: number;
  changeValorTotal: number;
  changeNegociosConcluidos: number;
  changeTaxaConversao: number;
}

export interface StageStats {
  prospeccao: number;
  comite: number;
  reprovadas: number;
  comercial: number;
  clienteAtivo: number;
  matchmaking: number;
  preparacao: number;
  apresentacao: number;
  negociacoes: number;
  concluido: number;
  clienteInativo: number;
}

/**
 * Tables type helper — maps table names to their row types.
 */
export type Tables<T extends string> =
  T extends 'operacoes' ? Operacao :
  T extends 'empresas' ? Empresa :
  T extends 'profiles' ? Profile :
  T extends 'membros_rede' ? MembroRede :
  T extends 'movimentacoes_historico' ? MovimentacaoHistorico :
  T extends 'notificacoes' ? Notificacao :
  Record<string, any>;
