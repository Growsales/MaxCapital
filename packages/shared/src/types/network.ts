export type TipoIndicacao = 'Direta' | 'Indireta';
export type StatusMembro = 'Ativo' | 'Inativo';

export interface MembroRede {
  id: string;
  indicador_id: string;
  indicado_id: string;
  indicacao: TipoIndicacao;
  nivel: number;
  numero_negocios: number;
  valor_total: number;
  ultimo_negocio?: string | null;
  status: StatusMembro;
  created_at: string;
  indicado?: {
    id: string;
    nome: string;
    email: string;
    avatar_url?: string | null;
  };
}

export interface RedeStats {
  total_membros: number;
  membros_diretos: number;
  membros_indiretos: number;
  total_negocios: number;
  valor_total: number;
  membros_ativos: number;
}
