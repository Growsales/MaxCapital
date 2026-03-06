export type EtapaPipeline =
  | 'Prospecto'
  | 'Comite'
  | 'Comercial'
  | 'Cliente Ativo'
  | 'Estruturacao'
  | 'Matchmaking'
  | 'Apresentacao'
  | 'Negociacao'
  | 'Concluido';

export type LeadTag = 'frio' | 'morno' | 'quente' | 'convertido';
export type TipoCapital = 'Captacao' | 'Investimento' | 'Hibrido';
export type StatusExclusividade = 'Ativo' | 'Vencido' | 'Sem exclusividade';
export type Office = 'Centro-Oeste' | 'Norte' | 'Sul' | 'Sudeste' | 'Nordeste';

export interface Operacao {
  id: string;
  numero_funil: string;
  empresa_id: string;
  empresa?: {
    id: string;
    nome: string;
    cnpj?: string;
    segmento?: string;
  };
  etapa_atual: EtapaPipeline;
  sub_etapa?: string | null;
  valor_investimento: number;
  tipo_capital: TipoCapital;
  segmento: string;
  responsavel_id: string;
  responsavel?: {
    id: string;
    nome: string;
    email: string;
    avatar_url?: string | null;
  };
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

export interface MovimentacaoHistorico {
  id: string;
  operacao_id: string;
  usuario_id: string;
  usuario?: {
    id: string;
    nome: string;
    avatar_url?: string | null;
  };
  etapa_anterior: EtapaPipeline;
  sub_etapa_anterior?: string | null;
  etapa_nova: EtapaPipeline;
  sub_etapa_nova?: string | null;
  data_hora: string;
  observacoes?: string | null;
}
