import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/components/button';
import { Badge } from '@/shared/components/badge';
import { motion } from 'framer-motion';
import { CourseCard } from './CourseCard';

interface CategoryRowProps {
  nome: string;
  cursos: Array<Record<string, any> & {
    progresso: number;
    status: 'não iniciado' | 'em andamento' | 'concluído';
  }>;
  playingCursoId: string | null;
  onPlay: (id: string) => void;
  onStop: () => void;
  index?: number;
}

export function CategoryRow({ nome, cursos, playingCursoId, onPlay, onStop, index = 0 }: CategoryRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const concluidos = cursos.filter(c => c.status === 'concluído').length;

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 340;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
    setTimeout(checkScroll, 350);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="space-y-3"
    >
      {/* Category Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-foreground">{nome}</h2>
          <Badge variant="secondary" className="text-xs">
            {concluidos}/{cursos.length}
          </Badge>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {cursos.map((curso, i) => (
          <CourseCard
            key={curso.id}
            curso={curso}
            isPlaying={playingCursoId === curso.id}
            onPlay={() => onPlay(curso.id)}
            onStop={onStop}
            index={i}
          />
        ))}
      </div>
    </motion.div>
  );
}
