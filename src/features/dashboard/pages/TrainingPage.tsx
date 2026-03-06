import { useState, useMemo, useCallback, useEffect } from 'react';
import ReactPlayer from 'react-player';
import {
  Play,
  CheckCircle2,
  Clock,
  Loader2,
  GraduationCap,
  ArrowLeft,
  BookOpen,
  TrendingUp,
  ChevronRight,
  X,
} from 'lucide-react';
import { Badge } from '@/shared/components/badge';
import { Button } from '@/shared/components/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useCursosComProgresso } from '@/hooks/useCursos';
import { useConfigImage } from '@/hooks/useConfigImages';
import { CourseCard } from '@/features/dashboard/components/training/CourseCard';
import { getCategoryThumb, getVideoThumb } from '@/features/dashboard/components/training/categoryThumbs';
import { useCategorias } from '@/hooks/useCategorias';

export default function TrainingPage() {
  const { data: cursos = [], isLoading } = useCursosComProgresso();
  const trainingHeroBg = useConfigImage('img_treinamentos_hero');
  const [playingCursoId, setPlayingCursoId] = useState<string | null>(null);
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);

  const totalCursos = cursos.length;
  const cursosCompletos = cursos.filter(c => c.status === 'concluído').length;
  const cursosEmAndamento = cursos.filter(c => c.status === 'em andamento').length;
  const progressoGeral = totalCursos > 0 ? Math.round((cursosCompletos / totalCursos) * 100) : 0;

  const parseDuration = (duracao: string | null): number => {
    if (!duracao) return 0;
    let totalMinutes = 0;
    const hoursMatch = duracao.match(/(\d+)\s*h/i);
    const minsMatch = duracao.match(/(\d+)\s*min/i);
    if (hoursMatch) totalMinutes += parseInt(hoursMatch[1]) * 60;
    if (minsMatch) totalMinutes += parseInt(minsMatch[1]);
    return totalMinutes;
  };

  const horasAssistidas = useMemo(() => {
    let totalMinutos = 0;
    cursos.forEach(curso => {
      if (curso.progresso > 0) {
        totalMinutos += Math.round((parseDuration(curso.duracao) * curso.progresso) / 100);
      }
    });
    if (totalMinutos >= 60) {
      const horas = Math.floor(totalMinutos / 60);
      const min = totalMinutos % 60;
      return min > 0 ? `${horas}h ${min}min` : `${horas}h`;
    }
    return `${totalMinutos}min`;
  }, [cursos]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && playingCursoId) {
        setPlayingCursoId(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [playingCursoId]);

  const { categorias: categoriasStore } = useCategorias();

  // Build categories from store (admin-managed), enriched with course progress
  const categorias = useMemo(() => {
    const activeCats = categoriasStore.filter(c => c.ativo).sort((a, b) => a.ordem - b.ordem);
    return activeCats.map(cat => {
      const catCursos = cursos.filter(c => (c.categoria || 'Outros') === cat.nome);
      return {
        nome: cat.nome,
        imagem_url: cat.imagem_url,
        total: catCursos.length,
        concluidos: catCursos.filter(c => c.status === 'concluído').length,
        emAndamento: catCursos.filter(c => c.status === 'em andamento').length,
      };
    });
  }, [cursos, categoriasStore]);

  const cursosCategoria = selectedCategoria
    ? cursos.filter(c => (c.categoria || 'Outros') === selectedCategoria)
    : [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando treinamentos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero - modern compact (hidden when inside a category) */}
      {!selectedCategoria && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative rounded-2xl overflow-hidden border border-border/30"
        >
          <img src={trainingHeroBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-card/95 via-card/80 to-card/40" />
          <div className="relative p-6 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="max-w-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
                    <GraduationCap className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">Academy</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Treinamentos</h1>
                <p className="text-muted-foreground text-sm">
                  Complete os cursos e aprimore suas habilidades como originador.
                </p>
              </div>
              <div className="flex items-center gap-5 bg-card/60 backdrop-blur-sm rounded-xl p-4 border border-border/30">
                <div className="relative h-16 w-16 flex-shrink-0">
                  <svg className="h-16 w-16 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--primary))" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${progressoGeral * 2.64} 264`} className="transition-all duration-700" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-foreground">{progressoGeral}%</span>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-foreground font-medium">{cursosCompletos}/{totalCursos} completos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-info" />
                    <span className="text-muted-foreground">{cursosEmAndamento} em andamento</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                    <span className="text-muted-foreground">{horasAssistidas} assistidas</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
      {selectedCategoria ? (
          /* ====== Prime Video style series view ====== */
          <motion.div
            key="courses"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-0"
          >
            {/* Hero banner */}
            {(() => {
              const catStore = categoriasStore.find(c => c.nome === selectedCategoria);
              const catInfo = categorias.find(c => c.nome === selectedCategoria);
              const catImage = catInfo?.imagem_url || getCategoryThumb(selectedCategoria);
              const completados = cursosCategoria.filter(c => c.status === 'concluído').length;
              const totalAulas = cursosCategoria.length;
              const descricao = catStore?.descricao;
              return (
                <div className="relative rounded-2xl overflow-hidden mb-6">
                  <img src={catImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-card/95 via-card/70 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                  <div className="relative p-8 md:p-12 min-h-[260px] flex flex-col justify-end">
                    <button
                      onClick={() => { setSelectedCategoria(null); setPlayingCursoId(null); }}
                      className="absolute top-4 left-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Voltar
                    </button>
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary">Trilha</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{selectedCategoria}</h1>
                    {descricao && (
                      <p className="text-muted-foreground text-sm max-w-xl mb-4">{descricao}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{totalAulas} {totalAulas === 1 ? 'aula' : 'aulas'}</span>
                      {completados > 0 && (
                        <span className="flex items-center gap-1 text-primary">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {completados} concluído{completados > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Play first unwatched */}
                    {totalAulas > 0 && (
                      <div className="mt-5 flex items-center gap-3">
                        <Button
                          onClick={() => {
                            const next = cursosCategoria.find(c => c.status !== 'concluído') || cursosCategoria[0];
                            if (next) setPlayingCursoId(next.id);
                          }}
                          className="gap-2 rounded-lg px-6"
                        >
                          <Play className="h-4 w-4" />
                          {cursosCategoria.some(c => c.status === 'em andamento') ? 'Continuar' : 'Reproduzir'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Episode list */}
            <div className="space-y-3">
              {cursosCategoria.map((curso, i) => {
                const thumbnail = curso.thumbnail_url || getVideoThumb(curso.id || String(i), i);
                const isPlaying = playingCursoId === curso.id;

                return (
                  <motion.div
                    key={curso.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    className={cn(
                      "group/ep flex gap-4 rounded-xl p-3 transition-colors cursor-pointer",
                      isPlaying ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/40"
                    )}
                    onClick={() => isPlaying ? setPlayingCursoId(null) : setPlayingCursoId(curso.id)}
                  >
                    {/* Episode number */}
                    <div className="flex-shrink-0 w-8 flex items-center justify-center">
                      <span className="text-lg font-bold text-muted-foreground">{i + 1}</span>
                    </div>

                    {/* Thumbnail */}
                    <div className="relative flex-shrink-0 w-40 md:w-52 aspect-video rounded-lg overflow-hidden">
                      <img src={thumbnail} alt={curso.titulo} className="w-full h-full object-cover group-hover/ep:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover/ep:opacity-100 transition-opacity">
                        <div className="h-10 w-10 rounded-full bg-primary/90 flex items-center justify-center">
                          <Play className="h-4 w-4 text-primary-foreground ml-0.5" />
                        </div>
                      </div>
                      {curso.progresso > 0 && curso.progresso < 100 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/30">
                          <div className="h-full bg-primary" style={{ width: `${curso.progresso}%` }} />
                        </div>
                      )}
                      {curso.status === 'concluído' && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm text-foreground group-hover/ep:text-primary transition-colors line-clamp-1">
                          {curso.titulo}
                        </h3>
                        {curso.status === 'concluído' && (
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {curso.duracao && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {curso.duracao}
                          </span>
                        )}
                        {curso.status === 'em andamento' && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {curso.progresso}%
                          </Badge>
                        )}
                      </div>
                      {curso.descricao && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 hidden md:block">
                          {curso.descricao}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Fullscreen Video Player Modal */}
            <AnimatePresence>
              {playingCursoId && (() => {
                const cursoPlaying = cursosCategoria.find(c => c.id === playingCursoId);
                if (!cursoPlaying) return null;
                return (
                  <motion.div
                    key="video-modal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black flex flex-col"
                  >
                    <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
                      <h3 className="text-white font-medium text-sm truncate">{cursoPlaying.titulo}</h3>
                      <button
                        onClick={(e) => { e.stopPropagation(); setPlayingCursoId(null); }}
                        className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors border border-white/30"
                      >
                        <X className="h-5 w-5 text-white" />
                      </button>
                    </div>
                    <ReactPlayer
                      src={cursoPlaying.video_url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'}
                      playing
                      controls
                      width="100%"
                      height="100%"
                      onEnded={() => setPlayingCursoId(null)}
                      style={{ background: '#000', objectFit: 'contain' }}
                    />
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* ====== Categories view ====== */
          <motion.div
            key="categories"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Escolha uma trilha</h2>
              <span className="text-xs text-muted-foreground">{categorias.length} categorias</span>
            </div>

            {categorias.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categorias.map((cat, i) => {
                  const catProgress = cat.total > 0 ? Math.round((cat.concluidos / cat.total) * 100) : 0;
                  return (
                    <motion.button
                      key={cat.nome}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.4 }}
                      onClick={() => setSelectedCategoria(cat.nome)}
                      className="group/cat rounded-2xl overflow-hidden border border-border/40 hover:border-primary/50 transition-all duration-300 bg-card hover:shadow-lg hover:shadow-primary/5 cursor-pointer text-left"
                    >
                      {/* Image */}
                      <div className="relative h-40 overflow-hidden">
                        <img
                          src={cat.imagem_url || getCategoryThumb(cat.nome)}
                          alt={cat.nome}
                          className="w-full h-full object-cover group-hover/cat:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                        
                      </div>

                      {/* Info */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-bold text-foreground group-hover/cat:text-primary transition-colors">
                            {cat.nome}
                          </h3>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover/cat:text-primary group-hover/cat:translate-x-0.5 transition-all" />
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5" />
                            {cat.total} {cat.total === 1 ? 'aula' : 'aulas'}
                          </span>
                          {cat.concluidos > 0 && (
                            <span className="flex items-center gap-1.5 text-primary">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {cat.concluidos} concluído{cat.concluidos > 1 ? 's' : ''}
                            </span>
                          )}
                          {cat.emAndamento > 0 && (
                            <span className="flex items-center gap-1.5 text-info">
                              <TrendingUp className="h-3.5 w-3.5" />
                              {cat.emAndamento} em progresso
                            </span>
                          )}
                        </div>

                        {/* Progress bar */}
                        <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${catProgress}%` }}
                          />
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-border/40 bg-card p-16 flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <GraduationCap className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Nenhum curso disponível</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  Novos cursos serão adicionados em breve. Fique atento!
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
