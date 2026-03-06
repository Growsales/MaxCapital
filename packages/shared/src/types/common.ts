export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type TipoNotificacao = 'sistema' | 'email' | 'whatsapp' | 'push';

export interface Notificacao {
  id: string;
  usuario_id: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem?: string | null;
  lida: boolean;
  canal: TipoNotificacao;
  created_at: string;
}

export type ComissaoStatus = 'pendente' | 'aprovada' | 'paga' | 'cancelada';

export interface Comissao {
  id: string;
  parceiro_id: string;
  operacao_id?: string | null;
  tipo: string;
  valor: number;
  status: ComissaoStatus;
  data_pagamento?: string | null;
  created_at: string;
}
