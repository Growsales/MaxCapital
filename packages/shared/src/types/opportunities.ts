export type StatusOportunidade = 'aberta' | 'encerrada' | 'captada';

export interface OportunidadeInvestimento {
  id: string;
  nome: string;
  tipo?: string | null;
  segmento?: string | null;
  instrumento?: string | null;
  rentabilidade?: number | null;
  investimento_minimo?: number | null;
  prazo?: number | null;
  pagamento?: string | null;
  status: StatusOportunidade;
  captado: number;
  alvo_minimo?: number | null;
  alvo_maximo?: number | null;
  investidores: number;
  data_inicio?: string | null;
  data_fim?: string | null;
  garantia?: string | null;
  devedora?: string | null;
  amortizacao?: string | null;
  descricao?: string | null;
  risco?: string | null;
  image_url?: string | null;
  destaque: boolean;
  originador_id?: string | null;
  empresa_dados?: Record<string, unknown> | null;
  financeiro?: Record<string, unknown> | null;
  documentos?: Record<string, unknown>[] | null;
  created_at: string;
  updated_at: string;
}

export interface ManifestacaoInteresse {
  id: string;
  oportunidade_id: string;
  usuario_id: string;
  created_at: string;
}
