export interface Curso {
  id: string;
  titulo: string;
  descricao?: string | null;
  categoria?: string | null;
  thumbnail_url?: string | null;
  video_url?: string | null;
  duracao?: number | null;
  ordem: number;
  ativo: boolean;
  created_at: string;
}

export interface Material {
  id: string;
  titulo: string;
  descricao?: string | null;
  categoria?: string | null;
  arquivo_url?: string | null;
  tipo?: string | null;
  ativo: boolean;
  created_at: string;
}
