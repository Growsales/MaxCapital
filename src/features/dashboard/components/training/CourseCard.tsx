import { Play, CheckCircle2, Clock, BarChart3, X } from 'lucide-react';
import { Badge } from '@/shared/components/badge';
import { Progress } from '@/shared/components/progress';
import { motion } from 'framer-motion';
import { getCategoryThumb, getVideoThumb } from './categoryThumbs';

interface CourseCardProps {
  curso: Record<string, any> & {
    progresso: number;
    status: 'não iniciado' | 'em andamento' | 'concluído';
  };
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  index?: number;
}

export function CourseCard({ curso, isPlaying, onPlay, onStop, index = 0 }: CourseCardProps) {
  const thumbnail = curso.thumbnail_url || getVideoThumb(curso.id || String(index), index);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="group/card"
    >
      <div className="rounded-2xl overflow-hidden border border-border/40 bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
        {/* Video / Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          {isPlaying ? (
            <>
              <video
                className="w-full h-full object-cover"
                controls
                autoPlay
                playsInline
                onEnded={onStop}
                src={
                  curso.video_url ||
                  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
                }
              />
              <button
                onClick={(e) => { e.stopPropagation(); onStop(); }}
                className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors z-10"
              >
                <X className="h-4 w-4 text-foreground" />
              </button>
            </>
          ) : (
            <button
              className="w-full h-full relative cursor-pointer"
              onClick={onPlay}
            >
              <img
                src={thumbnail}
                alt={curso.titulo}
                className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent group-hover/card:from-black/40 transition-colors duration-300" />
              
              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-14 w-14 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover/card:opacity-100 scale-75 group-hover/card:scale-100 transition-all duration-300 shadow-xl shadow-primary/30">
                  <Play className="h-6 w-6 text-primary-foreground ml-0.5" />
                </div>
              </div>

              {/* Bottom info overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center gap-2">
                  {curso.duracao && (
                    <span className="flex items-center gap-1 text-xs text-white/80">
                      <Clock className="h-3 w-3" />
                      {curso.duracao}
                    </span>
                  )}
                  {curso.nivel && (
                    <span className="flex items-center gap-1 text-xs text-white/80">
                      <BarChart3 className="h-3 w-3" />
                      {curso.nivel}
                    </span>
                  )}
                </div>
              </div>

              {/* Status badge */}
              {curso.status === 'concluído' && (
                <div className="absolute top-3 left-3">
                  <Badge className="bg-primary text-primary-foreground text-xs gap-1 shadow-sm">
                    <CheckCircle2 className="h-3 w-3" />
                    Completo
                  </Badge>
                </div>
              )}
              {curso.status === 'em andamento' && (
                <div className="absolute top-3 left-3">
                  <Badge className="bg-card/80 backdrop-blur-sm text-foreground text-xs gap-1 border-0 shadow-sm">
                    <Clock className="h-3 w-3 text-info" />
                    Em andamento
                  </Badge>
                </div>
              )}

              {/* Progress bar */}
              {curso.progresso > 0 && curso.progresso < 100 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/30">
                  <div className="h-full bg-primary transition-all" style={{ width: `${curso.progresso}%` }} />
                </div>
              )}
              {curso.status === 'concluído' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />
              )}
            </button>
          )}
        </div>

        {/* Info */}
        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-sm text-foreground group-hover/card:text-primary transition-colors line-clamp-2 leading-snug">
            {curso.titulo}
          </h3>
          
          {curso.progresso > 0 && curso.progresso < 100 && (
            <div className="flex items-center gap-2">
              <Progress value={curso.progresso} className="h-1.5 flex-1" />
              <span className="text-xs font-medium text-muted-foreground">{curso.progresso}%</span>
            </div>
          )}

          <p className="text-xs text-muted-foreground line-clamp-1">
            {curso.descricao || 'Clique para assistir'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
