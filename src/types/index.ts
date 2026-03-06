// User Types
export type UserType = 'parceiro' | 'empresa' | 'investidor' | 'admin' | 'master';
export type UserStatus = 'ativo' | 'inativo' | 'pendente_aprovacao';

export interface User {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  tipo: UserType;
  avatar?: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Company Types
export type Segmento = 'Startups' | 'Comercial' | 'Agronegócio' | 'Imobiliário' | 'Energia' | 'Ativos judiciais' | 'Outros';
export type TipoOperacao = 'Investimento' | 'Crédito' | 'Expansão' | 'Incorporação' | 'Financiamento';
export type StatusCadastro = 'completo' | 'incompleto';

export interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  nomeFantasia?: string;
  segmento: Segmento;
  responsavelId: string;
  contatoEmail: string;
  telefone?: string;
  endereco?: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
  };
  statusCadastro: StatusCadastro;
  valorOperacao: number;
  tipoOperacao: TipoOperacao;
  createdAt: Date;
  updatedAt: Date;
  criadoPorId: string;
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
  numeroFunil: string;
  empresaId: string;
  empresa?: Empresa;
  etapaAtual: EtapaPipeline;
  subEtapa?: string;
  valorInvestimento: number;
  tipoCapital: TipoCapital;
  segmento: Segmento;
  responsavelId: string;
  responsavel?: User;
  office: Office;
  leadTag: LeadTag;
  statusExclusividade: StatusExclusividade;
  dataExclusividade?: Date;
  diasNaEtapa: number;
  diasDesdeAtualizacao: number;
  createdAt: Date;
  ultimaMovimentacao: Date;
  observacoes?: string;
}

// Movement History
export interface MovimentacaoHistorico {
  id: string;
  operacaoId: string;
  usuarioId: string;
  usuario?: User;
  etapaAnterior: EtapaPipeline;
  subEtapaAnterior?: string;
  etapaNova: EtapaPipeline;
  subEtapaNova?: string;
  dataHora: Date;
  observacoes?: string;
}

// Notification Types
export type TipoNotificacao = 'sistema' | 'whatsapp' | 'email' | 'push';
export type StatusNotificacao = 'enviada' | 'lida' | 'erro';

export interface Notificacao {
  id: string;
  destinatarioId: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  operacaoId?: string;
  status: StatusNotificacao;
  createdAt: Date;
  lidaEm?: Date;
}

// Network/Rede Types
export interface MembroRede {
  id: string;
  indicacao: 'Direta' | 'Indireta';
  nivel: string;
  nome: string;
  numeroNegocios: number;
  valor: number;
  ultimoNegocio: Date;
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
