import type { Segmento } from '../types/companies';

export const SEGMENTOS: Segmento[] = [
  'Startups',
  'Comercial',
  'Agronegocio',
  'Imobiliario',
  'Energia',
  'Ativos judiciais',
  'Outros',
];

export const SEGMENTO_LABELS: Record<Segmento, string> = {
  'Startups': 'Startups',
  'Comercial': 'Comercial',
  'Agronegocio': 'Agronegócio',
  'Imobiliario': 'Imobiliário',
  'Energia': 'Energia',
  'Ativos judiciais': 'Ativos Judiciais',
  'Outros': 'Outros',
};

export const TIPOS_OPERACAO = [
  'Investimento',
  'Credito',
  'Expansao',
  'Incorporacao',
  'Financiamento',
] as const;

export const OFFICES = [
  'Centro-Oeste',
  'Norte',
  'Sul',
  'Sudeste',
  'Nordeste',
] as const;
