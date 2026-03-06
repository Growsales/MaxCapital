export type UserType = 'parceiro' | 'empresa' | 'investidor' | 'admin' | 'master';
export type UserStatus = 'ativo' | 'inativo' | 'pendente_aprovacao';

export interface Profile {
  id: string;
  nome: string;
  email: string;
  telefone?: string | null;
  tipo: UserType;
  avatar_url?: string | null;
  status: UserStatus;
  codigo_convite_proprio?: string | null;
  indicado_por_id?: string | null;
  total_indicacoes_diretas: number;
  total_indicacoes_indiretas: number;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  tipo: UserType;
  nome: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: AuthUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nome: string;
  tipo: UserType;
  telefone?: string;
  codigo_convite?: string;
}
