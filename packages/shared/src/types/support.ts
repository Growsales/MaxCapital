export type ChamadoCategoria = 'Duvida' | 'Bug' | 'Feature Request' | 'Outro';
export type ChamadoStatus = 'aberto' | 'em_andamento' | 'resolvido' | 'fechado';
export type ChamadoPrioridade = 'baixa' | 'media' | 'alta' | 'critica';

export interface Chamado {
  id: string;
  usuario_id: string;
  titulo: string;
  descricao: string;
  categoria: ChamadoCategoria;
  status: ChamadoStatus;
  prioridade: ChamadoPrioridade;
  atribuido_a?: string | null;
  created_at: string;
  updated_at: string;
  usuario?: {
    id: string;
    nome: string;
    avatar_url?: string | null;
  };
}

export interface ChamadoMensagem {
  id: string;
  chamado_id: string;
  usuario_id: string;
  mensagem: string;
  created_at: string;
  usuario?: {
    id: string;
    nome: string;
    avatar_url?: string | null;
  };
}
