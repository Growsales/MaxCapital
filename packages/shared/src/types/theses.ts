export interface TeseInvestimento {
  id: string;
  titulo: string;
  descricao?: string | null;
  tipo?: string | null;
  categoria?: string | null;
  valor_min?: number | null;
  valor_max?: number | null;
  ativo: boolean;
  setores?: string[] | null;
  modelo_negocio?: string | null;
  fase_investimento?: string | null;
  faturamento_min?: number | null;
  faturamento_max?: number | null;
  ebitda_min?: number | null;
  ebitda_max?: number | null;
  publico_alvo?: string | null;
  regioes?: string[] | null;
  tipo_transacao?: string | null;
  localizacao?: string | null;
  categoria_investidor?: string | null;
  informacoes_adicionais?: string | null;
  tese_quente: boolean;
  image_url?: string | null;
  investidor_id: string;
  investidor?: {
    id: string;
    nome: string;
    avatar_url?: string | null;
  };
  created_at: string;
  updated_at: string;
}
