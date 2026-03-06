export type FormBlockType =
  | 'text'
  | 'email'
  | 'number'
  | 'phone'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'textarea'
  | 'currency'
  | 'cnpj'
  | 'cpf'
  | 'section'
  | 'password';

export interface FormBlock {
  id: string;
  type: FormBlockType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  conditional?: {
    field: string;
    value: string;
  };
  order: number;
}

export interface FormDefinition {
  id: string;
  setor: string;
  segmento: string;
  titulo: string;
  ativo: boolean;
  blocos: FormBlock[];
  criado_por?: string | null;
  created_at: string;
  updated_at: string;
}
