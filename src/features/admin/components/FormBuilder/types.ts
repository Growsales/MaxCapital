/**
 * Form Builder Block Types & Definitions
 */

export type BlockCategory = 'field' | 'content' | 'metric' | 'document';

export type FieldBlockType =
  | 'text' | 'number' | 'currency' | 'select' | 'multiselect'
  | 'textarea' | 'checkbox' | 'date' | 'email' | 'phone' | 'cnpj' | 'cpf' | 'cep';

export type ContentBlockType =
  | 'heading' | 'paragraph' | 'separator' | 'image' | 'spacer' | 'alert' | 'section';

export type MetricBlockType =
  | 'metric-card' | 'progress-bar' | 'chart-bar' | 'chart-pie' | 'chart-line';

export type DocumentBlockType =
  | 'file-upload' | 'file-list' | 'signature';

export type BlockType = FieldBlockType | ContentBlockType | MetricBlockType | DocumentBlockType;

export interface BlockOption {
  value: string;
  label: string;
}

export interface FormBlock {
  id: string;
  type: BlockType;
  category: BlockCategory;
  label: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  options?: BlockOption[];
  defaultValue?: string;
  // Content-specific
  content?: string;
  level?: 1 | 2 | 3; // heading level
  variant?: 'info' | 'warning' | 'success' | 'error'; // alert variant
  // Metric-specific
  metricValue?: string;
  metricLabel?: string;
  metricUnit?: string;
  metricIcon?: string;
  // Chart-specific
  chartData?: { label: string; value: number }[];
  // Layout
  width?: 'full' | 'half' | 'third';
  // State
  ativo?: boolean;
  hidden?: boolean;
  disabled?: boolean;
  grupo?: string;
  grupoIcon?: string;
}

export interface BlockDefinition {
  type: BlockType;
  category: BlockCategory;
  label: string;
  icon: string;
  description: string;
  defaultProps: Partial<FormBlock>;
}

/** All available block definitions */
export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  // === Field Blocks ===
  { type: 'text', category: 'field', label: 'Texto Curto', icon: '📝', description: 'Campo de texto simples', defaultProps: { label: 'Campo de Texto', placeholder: 'Digite aqui...' } },
  { type: 'textarea', category: 'field', label: 'Texto Longo', icon: '📄', description: 'Campo de texto multilinha', defaultProps: { label: 'Texto Longo', placeholder: 'Descreva aqui...' } },
  { type: 'number', category: 'field', label: 'Número', icon: '🔢', description: 'Campo numérico', defaultProps: { label: 'Número', placeholder: '0' } },
  { type: 'currency', category: 'field', label: 'Moeda (R$)', icon: '💰', description: 'Campo monetário', defaultProps: { label: 'Valor', placeholder: 'R$ 0,00' } },
  { type: 'select', category: 'field', label: 'Seleção Única', icon: '☑️', description: 'Dropdown de seleção', defaultProps: { label: 'Selecione', options: [{ value: 'op1', label: 'Opção 1' }, { value: 'op2', label: 'Opção 2' }] } },
  { type: 'multiselect', category: 'field', label: 'Seleção Múltipla', icon: '✅', description: 'Seleção de múltiplos itens', defaultProps: { label: 'Selecione vários', options: [{ value: 'op1', label: 'Opção 1' }, { value: 'op2', label: 'Opção 2' }] } },
  { type: 'checkbox', category: 'field', label: 'Sim/Não', icon: '✔️', description: 'Caixa de marcação', defaultProps: { label: 'Marque se aplicável' } },
  { type: 'date', category: 'field', label: 'Data', icon: '📅', description: 'Seletor de data', defaultProps: { label: 'Data' } },
  { type: 'email', category: 'field', label: 'E-mail', icon: '📧', description: 'Campo de e-mail', defaultProps: { label: 'E-mail', placeholder: 'nome@email.com' } },
  { type: 'phone', category: 'field', label: 'Telefone', icon: '📱', description: 'Campo de telefone', defaultProps: { label: 'Telefone', placeholder: '(00) 00000-0000' } },
  { type: 'cnpj', category: 'field', label: 'CNPJ', icon: '🏢', description: 'Campo de CNPJ', defaultProps: { label: 'CNPJ', placeholder: '00.000.000/0000-00' } },
  { type: 'cpf', category: 'field', label: 'CPF', icon: '👤', description: 'Campo de CPF', defaultProps: { label: 'CPF', placeholder: '000.000.000-00' } },
  { type: 'cep', category: 'field', label: 'CEP', icon: '📍', description: 'Campo de CEP com busca automática', defaultProps: { label: 'CEP', placeholder: '00000-000' } },

  // === Content Blocks ===
  { type: 'section', category: 'content', label: 'Seção', icon: '📑', description: 'Divide o formulário em seções navegáveis', defaultProps: { content: 'Nova Seção', label: 'Nova Seção' } },
  { type: 'heading', category: 'content', label: 'Título', icon: '🔤', description: 'Título ou subtítulo', defaultProps: { content: 'Título da Seção', level: 2 } },
  { type: 'paragraph', category: 'content', label: 'Parágrafo', icon: '📃', description: 'Texto descritivo', defaultProps: { content: 'Adicione informações ou instruções aqui.' } },
  { type: 'separator', category: 'content', label: 'Separador', icon: '➖', description: 'Linha divisória', defaultProps: {} },
  { type: 'spacer', category: 'content', label: 'Espaçador', icon: '↕️', description: 'Espaço vertical', defaultProps: {} },
  { type: 'alert', category: 'content', label: 'Alerta', icon: '⚠️', description: 'Mensagem de destaque', defaultProps: { content: 'Informação importante', variant: 'info' } },
  { type: 'image', category: 'content', label: 'Imagem', icon: '🖼️', description: 'Imagem ou banner', defaultProps: { content: '' } },

  // === Metric Blocks ===
  { type: 'metric-card', category: 'metric', label: 'Card Métrica', icon: '📊', description: 'Card com valor e label', defaultProps: { metricLabel: 'Métrica', metricValue: '0', metricUnit: '', metricIcon: '📈' } },
  { type: 'progress-bar', category: 'metric', label: 'Barra Progresso', icon: '📶', description: 'Barra de progresso', defaultProps: { metricLabel: 'Progresso', metricValue: '50', metricUnit: '%' } },
  { type: 'chart-bar', category: 'metric', label: 'Gráfico Barras', icon: '📊', description: 'Gráfico de barras', defaultProps: { metricLabel: 'Dados', chartData: [{ label: 'A', value: 30 }, { label: 'B', value: 70 }, { label: 'C', value: 45 }] } },
  { type: 'chart-pie', category: 'metric', label: 'Gráfico Pizza', icon: '🥧', description: 'Gráfico de pizza', defaultProps: { metricLabel: 'Distribuição', chartData: [{ label: 'A', value: 30 }, { label: 'B', value: 70 }] } },
  { type: 'chart-line', category: 'metric', label: 'Gráfico Linha', icon: '📈', description: 'Gráfico de linha', defaultProps: { metricLabel: 'Tendência', chartData: [{ label: 'Jan', value: 10 }, { label: 'Fev', value: 25 }, { label: 'Mar', value: 40 }] } },

  // === Document Blocks ===
  { type: 'file-upload', category: 'document', label: 'Upload Arquivo', icon: '📎', description: 'Campo de upload', defaultProps: { label: 'Anexar documento' } },
  { type: 'file-list', category: 'document', label: 'Lista Documentos', icon: '📋', description: 'Lista de documentos', defaultProps: { label: 'Documentos necessários', content: 'Contrato Social\nBalancete\nDRE' } },
  { type: 'signature', category: 'document', label: 'Assinatura', icon: '✍️', description: 'Campo de assinatura', defaultProps: { label: 'Assinatura do responsável' } },
];

export const BLOCK_CATEGORIES: { key: BlockCategory; label: string; icon: string }[] = [
  { key: 'field', label: 'Campos', icon: '📝' },
  { key: 'content', label: 'Conteúdo', icon: '📃' },
  { key: 'metric', label: 'Métricas', icon: '📊' },
  { key: 'document', label: 'Documentos', icon: '📎' },
];

export function generateBlockId(): string {
  return `block_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createBlock(definition: BlockDefinition): FormBlock {
  return {
    id: generateBlockId(),
    type: definition.type,
    category: definition.category,
    label: definition.defaultProps.label || definition.label,
    width: 'full',
    ativo: true,
    ...definition.defaultProps,
  };
}

/** Form configuration for a setor/segmento */
export interface FormBuilderConfig {
  setor: string;
  segmento: string;
  blocks: FormBlock[];
  updatedAt: string;
  version: number;
}

/** Export format */
export interface FormExportData {
  type: 'form-builder-export';
  version: 1;
  config: FormBuilderConfig;
}
