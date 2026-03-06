import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight, TrendingUp, BarChart3, Users, Loader2, Newspaper, Building2, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/components/button';
import { Badge } from '@/shared/components/badge';
import { useAuth } from '@/shared/hooks/useAuth';
import { useNoticias } from '@/hooks/useNoticias';
import { NewDealModalWizard } from '@/features/operations/components/NewDealWizard/NewDealModalWizard';
import { useConfigImage } from '@/hooks/useConfigImages';

const FONTE_LABELS: Record<string, { label: string; color: string }> = {
  infomoney: { label: 'InfoMoney', color: 'bg-muted/60 text-muted-foreground' },
  suno: { label: 'Suno', color: 'bg-muted/60 text-muted-foreground' },
  valor: { label: 'Valor Econômico', color: 'bg-muted/60 text-muted-foreground' },
  investidor10: { label: 'Investidor10', color: 'bg-muted/60 text-muted-foreground' },
  b3: { label: 'B3', color: 'bg-muted/60 text-muted-foreground' },
  interno: { label: 'Max Capital', color: 'bg-muted/60 text-muted-foreground' },
};

const CATEGORIA_ICONS: Record<string, React.ReactNode> = {
  Bolsa: <TrendingUp className="h-4 w-4" />,
  Economia: <BarChart3 className="h-4 w-4" />,
  Câmbio: <TrendingUp className="h-4 w-4" />,
  FIIs: <Building2 className="h-4 w-4" />,
  B3: <BarChart3 className="h-4 w-4" />,
  'Renda Fixa': <TrendingUp className="h-4 w-4" />,
  Ações: <TrendingUp className="h-4 w-4" />,
  Institucional: <Building2 className="h-4 w-4" />,
  Programa: <Users className="h-4 w-4" />,
};

export default function DashboardPage() {
  const { profile, user } = useAuth();
  const dashboardHeroBg = useConfigImage('img_dashboard_hero');
  const { data: noticias, isLoading: isLoadingNoticias } = useNoticias();
  const [showNewDealWizard, setShowNewDealWizard] = useState(false);
  const [mercadoPage, setMercadoPage] = useState(1);
  const ITEMS_PER_PAGE = 3;

  const firstName = profile?.nome?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário';

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const d = new Date(date);
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffH < 1) return 'Agora';
    if (diffH < 24) return `${diffH}h atrás`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return 'Ontem';
    return `${diffD}d atrás`;
  };

  const noticiasMercado = noticias?.filter((n: any) => n.fonte && n.fonte !== 'interno') || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-border/40 p-8 md:p-12"
      >
        <img src={dashboardHeroBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-card/95 via-card/75 to-card/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-card/40 to-transparent" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Bem-vindo, <span className="text-primary">{firstName}</span>
            </h1>
            <p className="text-muted-foreground">
              Atue na originação e estruturação de operações estruturadas em diversos segmentos.
            </p>
          </div>
          <Button 
            className="btn-primary gap-2 whitespace-nowrap"
            onClick={() => setShowNewDealWizard(true)}
          >
            <Plus className="h-4 w-4" />
            {profile?.tipo === 'investidor' ? 'Submeter nova tese' : 'Submeter novo negócio'}
          </Button>
        </div>
      </motion.div>

      {/* Cards Row */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/teses" className="group">
          <div className="rounded-xl border border-border bg-card/50 hover:bg-card hover:border-primary/30 transition-all duration-300 p-5">
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-foreground mb-0.5">Teses de Investimento</h3>
                <p className="text-sm text-muted-foreground">Explore nossas teses e oportunidades de mercado</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-1" />
            </div>
          </div>
        </Link>

        <Link to="/relatorios" className="group">
          <div className="rounded-xl border border-border bg-card/50 hover:bg-card hover:border-primary/30 transition-all duration-300 p-5">
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-xl bg-secondary/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 className="h-5 w-5 text-secondary" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-foreground mb-0.5">Dados & Insights</h3>
                <p className="text-sm text-muted-foreground">Relatórios avançados e análises de mercado</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-1" />
            </div>
          </div>
        </Link>
      </div>

      {/* News Section with Tabs */}
      <div className="rounded-xl border border-border bg-card/50 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <Newspaper className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Notícias</h2>
            <p className="text-xs text-muted-foreground">Acompanhe as novidades do mercado e da plataforma</p>
          </div>
        </div>

        {isLoadingNoticias ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : noticiasMercado.length > 0 ? (
            <>
              <div className="space-y-3">
                {noticiasMercado.slice((mercadoPage - 1) * ITEMS_PER_PAGE, mercadoPage * ITEMS_PER_PAGE).map((noticia: any) => {
                  const fonteInfo = FONTE_LABELS[noticia.fonte] || FONTE_LABELS.interno;
                  const icon = CATEGORIA_ICONS[noticia.categoria] || <Newspaper className="h-4 w-4" />;
                  return (
                    <a
                      key={noticia.id}
                      href={noticia.fonte_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-4 p-4 rounded-lg border border-transparent hover:border-border hover:bg-muted/30 transition-all group cursor-pointer"
                    >
                      <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge variant="secondary" className={`text-[10px] px-2.5 py-0.5 border-0 rounded-md font-medium uppercase tracking-wider ${fonteInfo.color}`}>
                            {fonteInfo.label}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">{formatTimeAgo(noticia.created_at)}</span>
                        </div>
                        <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors leading-snug">{noticia.titulo}</h4>
                        {noticia.resumo && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{noticia.resumo}</p>
                        )}
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground flex-shrink-0 mt-1" />
                    </a>
                  );
                })}
              </div>

              {noticiasMercado.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <span className="text-[11px] text-muted-foreground">
                    {(mercadoPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(mercadoPage * ITEMS_PER_PAGE, noticiasMercado.length)} de {noticiasMercado.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setMercadoPage(p => Math.max(1, p - 1))}
                      disabled={mercadoPage === 1}
                      className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                    </button>
                    {Array.from({ length: Math.ceil(noticiasMercado.length / ITEMS_PER_PAGE) }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setMercadoPage(i + 1)}
                        className={`h-7 w-7 rounded-md text-xs font-medium transition-colors ${
                          mercadoPage === i + 1 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setMercadoPage(p => Math.min(Math.ceil(noticiasMercado.length / ITEMS_PER_PAGE), p + 1))}
                      disabled={mercadoPage >= Math.ceil(noticiasMercado.length / ITEMS_PER_PAGE)}
                      className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma notícia de mercado disponível.</p>
            </div>
          )}

          <div className="flex items-center gap-4 mt-5 pt-4 border-t border-border">
            <p className="text-[11px] text-muted-foreground">Fontes:</p>
            <div className="flex flex-wrap gap-2">
              {['infomoney', 'suno', 'valor', 'investidor10', 'b3'].map(f => {
                const info = FONTE_LABELS[f];
                return (
                  <span key={f} className={`text-[10px] px-2.5 py-1 rounded-md font-medium uppercase tracking-wider ${info.color}`}>
                    {info.label}
                  </span>
                );
              })}
            </div>
          </div>
      </div>

      <NewDealModalWizard open={showNewDealWizard} onOpenChange={setShowNewDealWizard} />
    </div>
  );
}
