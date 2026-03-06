import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Flame, MapPin, ArrowUpRight, TrendingUp, User, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/avatar';

export interface ThesisCardData {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  categoria: string;
  valor_min: number;
  valor_max: number;
  setores?: string[];
  tipo_transacao?: string[];
  tese_quente?: boolean;
  localizacao?: string;
  image_url?: string;
  investidor_id?: string;
  investidor?: { id: string; nome: string; avatar_url?: string | null };
}

interface ThesisCardProps {
  thesis: ThesisCardData;
  index?: number;
  onEdit?: (id: string) => void;
}

const sectorGradients: Record<string, string> = {
  'Tecnologia': 'from-blue-500/90 via-indigo-600/80 to-blue-800/90',
  'Agronegócio': 'from-emerald-500/90 via-green-600/80 to-teal-800/90',
  'Agro': 'from-emerald-500/90 via-green-600/80 to-teal-800/90',
  'Indústria': 'from-slate-400/90 via-slate-500/80 to-slate-700/90',
  'Financeiro': 'from-teal-400/90 via-emerald-500/80 to-cyan-700/90',
  'Fintech': 'from-violet-500/90 via-purple-600/80 to-indigo-800/90',
  'Energia': 'from-amber-400/90 via-orange-500/80 to-red-700/90',
  'Imobiliário': 'from-cyan-400/90 via-sky-500/80 to-blue-700/90',
  'Saúde': 'from-rose-400/90 via-pink-500/80 to-fuchsia-700/90',
  'Startups': 'from-purple-400/90 via-violet-500/80 to-indigo-700/90',
  'Varejo': 'from-orange-400/90 via-amber-500/80 to-yellow-700/90',
  'Educação': 'from-sky-400/90 via-blue-500/80 to-indigo-700/90',
  'Logística': 'from-stone-400/90 via-zinc-500/80 to-neutral-700/90',
  'Saneamento': 'from-teal-400/90 via-cyan-500/80 to-sky-700/90',
  'Infraestrutura': 'from-teal-400/90 via-cyan-500/80 to-sky-700/90',
  'Crédito': 'from-emerald-400/90 via-teal-500/80 to-cyan-700/90',
  'default': 'from-primary/70 via-primary/50 to-primary/30',
};

const getGradient = (sector: string): string => {
  return sectorGradients[sector] || sectorGradients['default'];
};

const formatValue = (value: number): string => {
  if (value >= 1000000000) return `R$ ${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(0)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
  return `R$ ${value}`;
};

export function ThesisCard({ thesis, index = 0, onEdit }: ThesisCardProps) {
  const navigate = useNavigate();
  const mainSector = thesis.setores?.[0] || thesis.categoria || 'default';
  const additionalSectors = thesis.setores ? thesis.setores.length - 1 : 0;
  const gradient = getGradient(mainSector);
  const transactionTypes = thesis.tipo_transacao || [thesis.tipo];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92, filter: 'blur(4px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.92, filter: 'blur(4px)' }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.04, 
        ease: [0.25, 0.46, 0.45, 0.94],
        layout: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group cursor-pointer"
      onClick={() => navigate(`/teses/${thesis.id}`)}
    >
      <div className="bg-card border border-border/40 rounded-2xl overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 h-full flex flex-col">
        {/* Banner */}
        <div className={`relative h-40 overflow-hidden ${!thesis.image_url ? `bg-gradient-to-br ${gradient}` : ''}`}>
          {thesis.image_url ? (
            <img src={thesis.image_url} alt={thesis.titulo} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
          ) : (
            <>
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.2),transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(0,0,0,0.15),transparent_50%)]" />
              <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
              <div className="absolute -top-4 -left-4 w-24 h-24 rounded-full bg-white/5 blur-xl" />
            </>
          )}
          {thesis.image_url && <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />}
          
          {/* Hot badge */}
          {thesis.tese_quente && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-orange-500/95 text-white border-0 gap-1 shadow-lg shadow-orange-500/30 text-[11px] px-2.5 py-1">
                <Flame className="h-3 w-3" />
                Tese Quente
              </Badge>
            </div>
          )}

          {/* Sector badges */}
          <div className="absolute bottom-3 left-3 right-12 flex items-center gap-1.5 flex-wrap">
            <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-md text-[11px] font-medium px-2.5 py-0.5">
              {mainSector}
            </Badge>
            {additionalSectors > 0 && (
              <Badge variant="secondary" className="bg-white/15 text-white/90 border-0 backdrop-blur-md text-[11px] px-2 py-0.5">
                +{additionalSectors} {additionalSectors === 1 ? 'setor' : 'setores'}
              </Badge>
            )}
          </div>

          {/* Edit button */}
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(thesis.id); }}
              className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-all duration-200 z-10"
              title="Editar tese"
            >
              <Pencil className="h-3.5 w-3.5 text-white" />
            </button>
          )}

          {/* Arrow */}
          <div className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:bg-white/20">
            <ArrowUpRight className="h-3.5 w-3.5 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1 gap-2.5">
          <h3 className="font-semibold text-foreground text-[15px] leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-200">
            {thesis.titulo}
          </h3>

          <p className="text-[13px] text-muted-foreground line-clamp-2 flex-1 leading-relaxed">
            {thesis.descricao}
          </p>

          {/* Transaction types */}
          <div className="flex flex-wrap gap-1.5">
            {transactionTypes.slice(0, 3).map((type, idx) => (
              <Badge key={idx} variant="outline" className="text-[10px] border-border/60 text-muted-foreground font-normal px-2 py-0.5 hover:border-primary/30 hover:text-primary transition-colors">
                {type}
              </Badge>
            ))}
          </div>


          {/* Footer */}
          <div className="pt-3 mt-auto border-t border-border/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Ticket</span>
              <p className="text-sm font-bold text-primary flex items-center gap-1.5 mt-0.5">
                <TrendingUp className="h-3.5 w-3.5" />
                {formatValue(thesis.valor_min)} – {formatValue(thesis.valor_max)}
              </p>
            </div>
            {thesis.localizacao && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/40 px-2 py-1 rounded-md">
                <MapPin className="h-3 w-3" />
                {thesis.localizacao}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
