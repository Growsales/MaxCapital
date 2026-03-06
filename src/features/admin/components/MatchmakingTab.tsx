/**
 * MatchmakingTab — Automatic matching of investor theses with available opportunities.
 * Also shows opportunities where the investor has manifested interest.
 */
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Zap, Target, Percent, Filter, ExternalLink, TrendingUp,
  DollarSign, BarChart3, CheckCircle2, AlertCircle, Flame,
} from 'lucide-react';
import { Card, CardContent } from '@/shared/components/card';
import { Button } from '@/shared/components/button';
import { Badge } from '@/shared/components/badge';
import { Progress } from '@/shared/components/progress';
import { Separator } from '@/shared/components/separator';
import { Avatar, AvatarFallback } from '@/shared/components/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/shared/components/select';
import { cn } from '@/lib/utils';
import { mockOportunidadesInvestimento, mockManifestacoes } from '@/lib/mock-data';
import type { NavigateFunction } from 'react-router-dom';

// ─── Matching Logic ─────────────────────────────────────────────

interface MatchResult {
  opportunity: typeof mockOportunidadesInvestimento[0];
  matchedThesis: any;
  score: number;
  reasons: { label: string; matched: boolean }[];
}

const SECTOR_MAPPING: Record<string, string[]> = {
  'Tecnologia': ['Tecnologia', 'SaaS', 'Fintech', 'Startups'],
  'Agronegócio': ['Agronegócio', 'Agro'],
  'Energia': ['Energia', 'Infraestrutura'],
  'Imobiliário': ['Imobiliário', 'Construção Civil'],
  'Startups': ['Tecnologia', 'SaaS', 'Fintech', 'Startups', 'Saúde', 'Biotecnologia'],
  'Saúde': ['Saúde', 'Biotecnologia'],
  'Infraestrutura': ['Infraestrutura', 'Saneamento', 'Energia'],
};

function calculateMatch(thesis: any, opportunity: typeof mockOportunidadesInvestimento[0]): { score: number; reasons: { label: string; matched: boolean }[] } {
  const reasons: { label: string; matched: boolean }[] = [];
  let score = 0;
  const maxScore = 5;

  // 1. Sector match (weight: 2)
  const thesisSetores = thesis.setores || [];
  const oppSegmento = opportunity.segmento;
  const expandedOppSectors = SECTOR_MAPPING[oppSegmento] || [oppSegmento];
  const sectorMatch = thesisSetores.some((s: string) =>
    expandedOppSectors.some(es => es.toLowerCase() === s.toLowerCase()) ||
    s.toLowerCase() === oppSegmento.toLowerCase()
  );
  reasons.push({ label: 'Setor compatível', matched: sectorMatch });
  if (sectorMatch) score += 2;

  // 2. Type match (Equity vs Dívida)
  const typeMatch = thesis.tipo?.toLowerCase() === opportunity.tipo?.toLowerCase() ||
    (thesis.tipo === 'Equity' && opportunity.tipo === 'Equity') ||
    (thesis.tipo === 'Crédito' && opportunity.tipo === 'Dívida') ||
    (thesis.tipo === 'Project Finance' && opportunity.tipo === 'Dívida');
  reasons.push({ label: 'Tipo de operação', matched: typeMatch });
  if (typeMatch) score += 1;

  // 3. Value range overlap (weight: 1.5)
  const thesisMin = thesis.valor_min || 0;
  const thesisMax = thesis.valor_max || Infinity;
  const oppMin = opportunity.investimento_minimo || 0;
  const oppMax = opportunity.alvo_maximo || Infinity;
  const valueOverlap = thesisMin <= oppMax && thesisMax >= oppMin;
  reasons.push({ label: 'Faixa de investimento', matched: valueOverlap });
  if (valueOverlap) score += 1.5;

  // 4. Opportunity is open
  const isOpen = opportunity.status === 'aberta';
  reasons.push({ label: 'Oportunidade aberta', matched: isOpen });
  if (isOpen) score += 0.5;

  return { score: Math.round((score / maxScore) * 100), reasons };
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-muted-foreground';
}

function getScoreBadgeClass(score: number) {
  if (score >= 80) return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
  if (score >= 60) return 'bg-amber-500/10 text-amber-600 border-amber-200';
  return 'bg-muted text-muted-foreground';
}

function getScoreLabel(score: number) {
  if (score >= 80) return 'Alta';
  if (score >= 60) return 'Média';
  return 'Baixa';
}

// ─── Format Helpers ─────────────────────────────────────────────

const formatCurrency = (val?: number) => {
  if (!val) return '—';
  if (val >= 1000000000) return `R$ ${(val / 1000000000).toFixed(1)}B`;
  if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(0)}M`;
  if (val >= 1000) return `R$ ${(val / 1000).toFixed(0)}K`;
  return `R$ ${val}`;
};

// ─── Component ──────────────────────────────────────────────────

interface MatchmakingTabProps {
  teses: any[];
  investorName: string;
  investorId?: string;
  navigate: NavigateFunction;
}

const interessadoStatusConfig: Record<string, { label: string; className: string }> = {
  interessado: { label: 'Interessado', className: 'bg-primary/10 text-primary border-primary/20' },
  pendente: { label: 'Pendente', className: 'bg-amber-500/10 text-amber-600 border-amber-200' },
  aprovada: { label: 'Aprovado', className: 'bg-primary/10 text-primary border-primary/20' },
  rejeitada: { label: 'Rejeitado', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export function MatchmakingTab({ teses, investorName, investorId, navigate }: MatchmakingTabProps) {
  const [minScore, setMinScore] = useState('0');
  const [sectorFilter, setSectorFilter] = useState('all');

  // Generate matches for all active theses against all opportunities
  const matches = useMemo(() => {
    const activeTeses = teses.filter((t: any) => t.ativo);
    const results: MatchResult[] = [];

    for (const thesis of activeTeses) {
      for (const opp of mockOportunidadesInvestimento) {
        const { score, reasons } = calculateMatch(thesis, opp);
        if (score > 0) {
          results.push({ opportunity: opp, matchedThesis: thesis, score, reasons });
        }
      }
    }

    // Sort by score desc, deduplicate by opportunity (keep highest score)
    const bestByOpp = new Map<string, MatchResult>();
    for (const r of results) {
      const existing = bestByOpp.get(r.opportunity.id);
      if (!existing || r.score > existing.score) {
        bestByOpp.set(r.opportunity.id, r);
      }
    }

    return Array.from(bestByOpp.values()).sort((a, b) => b.score - a.score);
  }, [teses]);

  // Apply filters
  const filteredMatches = useMemo(() => {
    let results = matches;
    const minScoreNum = parseInt(minScore);
    if (minScoreNum > 0) {
      results = results.filter(m => m.score >= minScoreNum);
    }
    if (sectorFilter !== 'all') {
      results = results.filter(m => m.opportunity.segmento === sectorFilter);
    }
    return results;
  }, [matches, minScore, sectorFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: matches.length,
    alta: matches.filter(m => m.score >= 80).length,
    media: matches.filter(m => m.score >= 60 && m.score < 80).length,
    baixa: matches.filter(m => m.score < 60).length,
  }), [matches]);

  const uniqueSectors = useMemo(() => {
    const sectors = new Set(matches.map(m => m.opportunity.segmento));
    return Array.from(sectors).sort();
  }, [matches]);
  // Opportunities where investor has manifested interest
  const interestedOpportunities = useMemo(() => {
    if (!investorId) return [];
    const manifestacoes = mockManifestacoes.filter(
      m => ((m as any).investidor_id || (m as any).usuario_id) === investorId
    );
    return manifestacoes.map(m => {
      const opp = mockOportunidadesInvestimento.find(o => o.id === m.oportunidade_id);
      return {
        id: m.id,
        oportunidade: opp,
        status: (m as any).status || 'interessado',
        created_at: m.created_at,
      };
    }).filter(item => item.oportunidade);
  }, [investorId]);

  if (interestedOpportunities.length === 0) {
    return (
      <Card className="border-0">
        <CardContent className="p-12 text-center">
          <Flame className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="font-medium text-muted-foreground">Nenhuma oportunidade com interesse</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Este investidor ainda não manifestou interesse em nenhuma oportunidade.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Oportunidades com interesse ({interestedOpportunities.length})
            </h3>
          </div>
          <div className="space-y-3">
            {interestedOpportunities.map((item, index) => {
              const opp = item.oportunidade!;
              const sc = interessadoStatusConfig[item.status] || interessadoStatusConfig.pendente;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-foreground truncate">{opp.nome}</p>
                        <Badge variant="outline" className="text-[10px] shrink-0">{opp.segmento}</Badge>
                        <Badge variant={opp.status === 'aberta' ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                          {opp.status === 'aberta' ? 'Aberta' : opp.status === 'captada' ? 'Captada' : 'Encerrada'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Tipo: <span className="font-medium text-foreground">{opp.tipo}</span></span>
                        <span>Alvo: <span className="font-medium text-foreground">{formatCurrency(opp.alvo_minimo)} – {formatCurrency(opp.alvo_maximo)}</span></span>
                        <span>Rentabilidade: <span className="font-medium text-primary">{opp.rentabilidade}% a.a.</span></span>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn('text-[10px] border shrink-0', sc.className)}>
                      {sc.label}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 shrink-0"
                      onClick={() => navigate(`/oportunidades/${opp.id}`)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Ver
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
