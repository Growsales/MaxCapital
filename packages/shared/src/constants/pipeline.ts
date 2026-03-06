import type { EtapaPipeline } from '../types/operations';

export const PIPELINE_STAGES: EtapaPipeline[] = [
  'Prospecto',
  'Comite',
  'Comercial',
  'Cliente Ativo',
  'Estruturacao',
  'Matchmaking',
  'Apresentacao',
  'Negociacao',
  'Concluido',
];

export const INVESTOR_VISIBLE_STAGES: EtapaPipeline[] = [
  'Estruturacao',
  'Matchmaking',
  'Apresentacao',
  'Negociacao',
  'Concluido',
];

export const STAGE_LABELS: Record<EtapaPipeline, string> = {
  'Prospecto': 'Prospecto',
  'Comite': 'Comitê',
  'Comercial': 'Comercial',
  'Cliente Ativo': 'Cliente Ativo',
  'Estruturacao': 'Estruturação',
  'Matchmaking': 'Matchmaking',
  'Apresentacao': 'Apresentação',
  'Negociacao': 'Negociação',
  'Concluido': 'Concluído',
};

export const EDITABLE_STAGES: EtapaPipeline[] = ['Prospecto'];
