import type { StatusExclusividade } from './operations';

export type Segmento =
  | 'Startups'
  | 'Comercial'
  | 'Agronegocio'
  | 'Imobiliario'
  | 'Energia'
  | 'Ativos judiciais'
  | 'Outros';

export type TipoOperacao =
  | 'Investimento'
  | 'Credito'
  | 'Expansao'
  | 'Incorporacao'
  | 'Financiamento';

export type StatusCadastro = 'completo' | 'incompleto';

export interface Empresa {
  id: string;
  nome: string;
  cnpj?: string | null;
  nome_fantasia?: string | null;
  segmento: Segmento;
  responsavel_id: string;
  contato_email?: string | null;
  telefone?: string | null;
  endereco_cep?: string | null;
  endereco_logradouro?: string | null;
  endereco_numero?: string | null;
  endereco_complemento?: string | null;
  endereco_bairro?: string | null;
  endereco_cidade?: string | null;
  endereco_uf?: string | null;
  status_cadastro: StatusCadastro;
  valor_operacao?: number | null;
  tipo_operacao?: TipoOperacao | null;
  status_exclusividade: StatusExclusividade;
  data_exclusividade?: string | null;
  logo_url?: string | null;
  criado_por_id?: string | null;
  created_at: string;
  updated_at: string;
  responsavel?: {
    nome: string;
    email: string;
  };
}
