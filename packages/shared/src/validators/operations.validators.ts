import { z } from 'zod';

export const createOperacaoSchema = z.object({
  empresa_id: z.string().uuid(),
  valor_investimento: z.number().positive('Valor deve ser positivo'),
  tipo_capital: z.enum(['Captacao', 'Investimento', 'Hibrido']),
  segmento: z.string().min(1),
  office: z.enum(['Centro-Oeste', 'Norte', 'Sul', 'Sudeste', 'Nordeste']),
  lead_tag: z.enum(['frio', 'morno', 'quente', 'convertido']).default('frio'),
  observacoes: z.string().optional(),
  data_exclusividade: z.string().datetime().optional(),
});

export const updateOperacaoSchema = z.object({
  valor_investimento: z.number().positive().optional(),
  tipo_capital: z.enum(['Captacao', 'Investimento', 'Hibrido']).optional(),
  segmento: z.string().min(1).optional(),
  office: z.enum(['Centro-Oeste', 'Norte', 'Sul', 'Sudeste', 'Nordeste']).optional(),
  lead_tag: z.enum(['frio', 'morno', 'quente', 'convertido']).optional(),
  observacoes: z.string().optional(),
  data_exclusividade: z.string().datetime().optional().nullable(),
  sub_etapa: z.string().optional().nullable(),
});

export const moveOperacaoSchema = z.object({
  etapa_nova: z.enum([
    'Prospecto', 'Comite', 'Comercial', 'Cliente Ativo',
    'Estruturacao', 'Matchmaking', 'Apresentacao', 'Negociacao', 'Concluido',
  ]),
  observacoes: z.string().optional(),
});

export const listOperacoesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  etapa: z.string().optional(),
  responsavel: z.string().uuid().optional(),
  search: z.string().optional(),
  lead_tag: z.enum(['frio', 'morno', 'quente', 'convertido']).optional(),
  office: z.string().optional(),
});

export type CreateOperacaoInput = z.infer<typeof createOperacaoSchema>;
export type UpdateOperacaoInput = z.infer<typeof updateOperacaoSchema>;
export type MoveOperacaoInput = z.infer<typeof moveOperacaoSchema>;
