export interface AuditLog {
  id: string;
  usuario_id?: string | null;
  acao: string;
  recurso: string;
  recurso_id?: string | null;
  detalhes?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  usuario?: {
    id: string;
    nome: string;
  };
}

export type Permission = string; // format: "recurso:acao"

export interface RolePermissions {
  role: string;
  permissions: Permission[];
}
