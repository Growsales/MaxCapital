import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Flame,
  SlidersHorizontal,
  Lightbulb,
  X,
  Sparkles,
  Pencil
} from 'lucide-react';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { Checkbox } from '@/shared/components/checkbox';
import { Badge } from '@/shared/components/badge';
import { useTesesInvestimento } from '@/hooks/useTeses';
import { ThesisCard, ThesisCardData } from '@/components/teses/ThesisCard';
import { Skeleton } from '@/shared/components/skeleton';
import { useConfigImage } from '@/hooks/useConfigImages';
import { useAuth } from '@/shared/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/sheet';

const setores = [
  'Tecnologia', 'Agronegócio', 'Saúde', 'Energia', 'Financeiro',
  'Imobiliário', 'Indústria', 'Startups', 'Varejo', 'Educação', 'Logística',
];

const tiposOperacao = [
  { id: 'total', label: 'Venda total' },
  { id: 'majoritaria', label: 'Majoritária' },
  { id: 'minoritaria', label: 'Minoritária' },
];

function FiltersContent({
  searchQuery, setSearchQuery,
  selectedSetores, setSelectedSetores,
  selectedTipos, setSelectedTipos,
  showOnlyHot, setShowOnlyHot,
}: {
  searchQuery: string; setSearchQuery: (v: string) => void;
  selectedSetores: string[]; setSelectedSetores: (v: string[]) => void;
  selectedTipos: string[]; setSelectedTipos: (v: string[]) => void;
  showOnlyHot: boolean; setShowOnlyHot: (v: boolean) => void;
}) {
  const toggleSetor = (setor: string) => {
    setSelectedSetores(
      selectedSetores.includes(setor)
        ? selectedSetores.filter(s => s !== setor)
        : [...selectedSetores, setor]
    );
  };

  const toggleTipo = (tipo: string) => {
    setSelectedTipos(
      selectedTipos.includes(tipo)
        ? selectedTipos.filter(t => t !== tipo)
        : [...selectedTipos, tipo]
    );
  };

  const hasActiveFilters = selectedSetores.length > 0 || selectedTipos.length > 0 || showOnlyHot;

  return (
    <div className="space-y-5">
      {/* Search */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">
          Busca por palavra ou código
        </label>
        <div className="flex gap-1.5">
          <Input
            type="text"
            placeholder="Digite aqui..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 h-9 text-sm"
          />
          <Button size="icon" className="h-9 w-9 shrink-0">
            <Search className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Natureza */}
      <div>
        <h4 className="text-xs font-semibold text-foreground mb-2.5 uppercase tracking-wider">Natureza da Operação</h4>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2.5 text-sm text-muted-foreground cursor-pointer py-1 hover:text-foreground transition-colors">
            <Checkbox 
              checked={!showOnlyHot && selectedSetores.length === 0 && selectedTipos.length === 0}
              onCheckedChange={() => {
                setShowOnlyHot(false);
                setSelectedSetores([]);
                setSelectedTipos([]);
              }}
            />
            Todas as teses
          </label>
          <label className="flex items-center gap-2.5 text-sm cursor-pointer py-1 hover:text-foreground transition-colors">
            <Checkbox 
              checked={showOnlyHot}
              onCheckedChange={(checked) => setShowOnlyHot(checked as boolean)}
            />
            <span className="flex items-center gap-1.5 text-orange-500">
              <Flame className="h-3.5 w-3.5" />
              Teses quentes
            </span>
          </label>
        </div>
      </div>

      {/* Tipo de Operação */}
      <div>
        <h4 className="text-xs font-semibold text-foreground mb-2.5 uppercase tracking-wider">Tipo de Operação</h4>
        <div className="space-y-1.5">
          {tiposOperacao.map((tipo) => (
            <label key={tipo.id} className="flex items-center gap-2.5 text-sm text-muted-foreground cursor-pointer py-1 hover:text-foreground transition-colors">
              <Checkbox 
                checked={selectedTipos.includes(tipo.id)}
                onCheckedChange={() => toggleTipo(tipo.id)}
              />
              {tipo.label}
            </label>
          ))}
        </div>
      </div>

      {/* Setor */}
      <div>
        <h4 className="text-xs font-semibold text-foreground mb-2.5 uppercase tracking-wider">Setor de operação</h4>
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
          {setores.map((setor) => (
            <label key={setor} className="flex items-center gap-2.5 text-sm text-muted-foreground cursor-pointer py-1 hover:text-foreground transition-colors">
              <Checkbox 
                checked={selectedSetores.includes(setor)}
                onCheckedChange={() => toggleSetor(setor)}
              />
              {setor}
            </label>
          ))}
        </div>
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground hover:text-foreground gap-1.5"
          onClick={() => {
            setShowOnlyHot(false);
            setSelectedSetores([]);
            setSelectedTipos([]);
          }}
        >
          <X className="h-3 w-3" />
          Limpar todos os filtros
        </Button>
      )}
    </div>
  );
}

export default function ThesesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const thesesHeroBg = useConfigImage('img_teses_hero');
  const [selectedSetores, setSelectedSetores] = useState<string[]>([]);
  const [selectedTipos, setSelectedTipos] = useState<string[]>([]);
  const [showOnlyHot, setShowOnlyHot] = useState(false);
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  
  const isInvestidor = profile?.tipo === 'investidor';
  
  const { data: teses = [], isLoading } = useTesesInvestimento({ searchQuery });
  
  // For investors, show only their own theses
  const baseTeses = isInvestidor 
    ? teses.filter(t => t.investidor_id === user?.id)
    : teses;

  const filteredTeses = baseTeses.filter(tese => {
    if (showOnlyHot && !tese.tese_quente) return false;
    if (selectedSetores.length > 0) {
      const teseSetores = tese.setores || [tese.categoria];
      if (!selectedSetores.some(s => teseSetores.includes(s))) return false;
    }
    if (selectedTipos.length > 0) {
      const teseTipos = tese.tipo_transacao || [tese.tipo?.toLowerCase()];
      const normalizedTipos = teseTipos.map(t => t?.toLowerCase());
      const hasMatchingType = selectedTipos.some(selected => {
        if (selected === 'total') return normalizedTipos.some(t => t?.includes('total'));
        if (selected === 'majoritaria') return normalizedTipos.some(t => t?.includes('majorit'));
        if (selected === 'minoritaria') return normalizedTipos.some(t => t?.includes('minorit'));
        return false;
      });
      if (!hasMatchingType) return false;
    }
    return true;
  }) as ThesisCardData[];

  const activeFiltersCount = selectedSetores.length + selectedTipos.length + (showOnlyHot ? 1 : 0);
  const hotCount = baseTeses.filter(t => t.tese_quente).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative rounded-2xl overflow-hidden border border-border/40 p-8 md:p-10"
      >
        <img src={thesesHeroBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-card/95 via-card/75 to-card/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-card/40 to-transparent" />
        <div className="max-w-2xl relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Lightbulb className="h-4 w-4 text-primary" />
            </div>
            <Badge variant="outline" className="border-primary/30 text-primary text-[11px]">
              {baseTeses.length} {isInvestidor ? 'teses suas' : 'teses disponíveis'}
            </Badge>
            {hotCount > 0 && (
              <Badge className="bg-orange-500/15 text-orange-500 border-orange-500/20 text-[11px] gap-1">
                <Flame className="h-3 w-3" />{hotCount} quentes
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
            {isInvestidor ? 'Minhas Teses' : 'Teses de Investimento'}
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
            {isInvestidor 
              ? 'Gerencie e edite suas teses de investimento para atrair os negócios certos.'
              : 'Encontre oportunidades alinhadas às teses de investidores em busca de negócios promissores.'}
          </p>
        </div>
      </motion.div>

      {/* Layout Grid */}
      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar Filters - Desktop */}
        <div className="hidden lg:block">
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-2xl border border-border/40 bg-card p-5 sticky top-6"
          >
            <h3 className="font-semibold text-foreground text-sm mb-5 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              Minha Busca
              {activeFiltersCount > 0 && (
                <Badge className="ml-auto bg-primary/15 text-primary border-0 text-[10px] px-1.5">
                  {activeFiltersCount}
                </Badge>
              )}
            </h3>
            <FiltersContent
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedSetores={selectedSetores}
              setSelectedSetores={setSelectedSetores}
              selectedTipos={selectedTipos}
              setSelectedTipos={setSelectedTipos}
              showOnlyHot={showOnlyHot}
              setShowOnlyHot={setShowOnlyHot}
            />
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="space-y-5">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex items-center justify-between gap-4"
          >
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {isInvestidor ? 'Minhas teses' : 'Teses de investimento'}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {filteredTeses.length} {filteredTeses.length === 1 ? 'tese encontrada' : 'teses encontradas'}
              </p>
            </div>
            
            {/* Active filter tags */}
            {activeFiltersCount > 0 && (
              <div className="hidden md:flex items-center gap-1.5 flex-wrap">
                {showOnlyHot && (
                  <Badge variant="outline" className="text-[10px] gap-1 border-orange-500/30 text-orange-500">
                    <Flame className="h-2.5 w-2.5" />Quentes
                    <X className="h-2.5 w-2.5 ml-0.5 cursor-pointer" onClick={() => setShowOnlyHot(false)} />
                  </Badge>
                )}
                {selectedSetores.slice(0, 2).map(s => (
                  <Badge key={s} variant="outline" className="text-[10px] gap-1">
                    {s}
                    <X className="h-2.5 w-2.5 ml-0.5 cursor-pointer" onClick={() => setSelectedSetores(selectedSetores.filter(x => x !== s))} />
                  </Badge>
                ))}
                {selectedSetores.length > 2 && (
                  <Badge variant="outline" className="text-[10px]">+{selectedSetores.length - 2}</Badge>
                )}
              </div>
            )}
            
            {/* Mobile Filter Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden gap-2">
                  <Filter className="h-3.5 w-3.5" />
                  Filtros
                  {activeFiltersCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-primary text-primary-foreground rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FiltersContent
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedSetores={selectedSetores}
                    setSelectedSetores={setSelectedSetores}
                    selectedTipos={selectedTipos}
                    setSelectedTipos={setSelectedTipos}
                    showOnlyHot={showOnlyHot}
                    setShowOnlyHot={setShowOnlyHot}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </motion.div>

          {/* Cards Grid */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border/30 overflow-hidden">
                  <Skeleton className="h-40 rounded-none" />
                  <div className="space-y-2.5 p-5">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="pt-3 border-t border-border/20 mt-3">
                      <Skeleton className="h-5 w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTeses.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 bg-card rounded-2xl border border-border/30"
            >
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                  <Sparkles className="h-7 w-7 text-muted-foreground/50" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground mb-1">Nenhuma tese encontrada</p>
                  <p className="text-sm text-muted-foreground">Tente ajustar os filtros ou a busca.</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSetores([]);
                    setSelectedTipos([]);
                    setShowOnlyHot(false);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                  Limpar filtros
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              layout
              className="grid md:grid-cols-2 xl:grid-cols-3 gap-5"
            >
              <AnimatePresence mode="popLayout">
                {filteredTeses.map((tese, index) => (
                  <ThesisCard 
                    key={tese.id} 
                    thesis={tese} 
                    index={index} 
                    onEdit={isInvestidor ? (id) => navigate(`/teses/${id}/editar`) : undefined}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
