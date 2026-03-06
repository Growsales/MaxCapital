import { useState } from 'react';
import { 
  Search, 
  Download, 
  BookOpen, 
  FileText, 
  HelpCircle,
  Loader2,
  FolderOpen,
  Filter,
  Eye,
  ChevronRight,
  Lightbulb,
  Shield,
  Rocket,
} from 'lucide-react';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { Card, CardContent } from '@/shared/components/card';
import { Badge } from '@/shared/components/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useConfigImage } from '@/hooks/useConfigImages';

// Mock data for guides since there's no separate DB table yet
const guidesData = [
  {
    id: '1',
    titulo: 'Guia do Originador',
    descricao: 'Manual completo para originadores de negócios. Aprenda como prospectar, qualificar e submeter operações.',
    categoria: 'originacao',
    formato: 'PDF',
    paginas: 45,
    atualizado: '2025-01-15',
    destaque: true,
    icon: Rocket,
  },
  {
    id: '2',
    titulo: 'Manual de Compliance',
    descricao: 'Diretrizes de compliance e conformidade para operações de crédito estruturado e investimentos.',
    categoria: 'compliance',
    formato: 'PDF',
    paginas: 32,
    atualizado: '2025-02-01',
    destaque: true,
    icon: Shield,
  },
  {
    id: '3',
    titulo: 'Guia de Análise de Crédito',
    descricao: 'Metodologia de análise de crédito utilizada pela Max Capital para avaliação de operações.',
    categoria: 'analise',
    formato: 'PDF',
    paginas: 28,
    atualizado: '2024-12-20',
    destaque: false,
    icon: FileText,
  },
  {
    id: '4',
    titulo: 'Manual da Plataforma',
    descricao: 'Tutorial completo de uso da plataforma. Cadastro de operações, acompanhamento e relatórios.',
    categoria: 'plataforma',
    formato: 'PDF',
    paginas: 20,
    atualizado: '2025-02-10',
    destaque: false,
    icon: HelpCircle,
  },
  {
    id: '5',
    titulo: 'Guia de Garantias',
    descricao: 'Tipos de garantias aceitas, documentação necessária e processos de formalização.',
    categoria: 'analise',
    formato: 'PDF',
    paginas: 18,
    atualizado: '2024-11-05',
    destaque: false,
    icon: Shield,
  },
  {
    id: '6',
    titulo: 'FAQ - Perguntas Frequentes',
    descricao: 'Respostas para as dúvidas mais comuns de parceiros, empresas e investidores.',
    categoria: 'plataforma',
    formato: 'PDF',
    paginas: 12,
    atualizado: '2025-01-28',
    destaque: false,
    icon: Lightbulb,
  },
];

const categoriasGuias = [
  { id: 'originacao', nome: 'Originação' },
  { id: 'compliance', nome: 'Compliance' },
  { id: 'analise', nome: 'Análise' },
  { id: 'plataforma', nome: 'Plataforma' },
];

export default function GuidesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const guidesHeroBg = useConfigImage('img_guias_hero');
  const [activeCategoria, setActiveCategoria] = useState<string | null>(null);

  const filtered = guidesData.filter(guide => {
    const matchesSearch = guide.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          guide.descricao.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = activeCategoria ? guide.categoria === activeCategoria : true;
    return matchesSearch && matchesCat;
  });

  const destaques = guidesData.filter(g => g.destaque);

  const formatDate = (date: string) => new Intl.DateTimeFormat('pt-BR').format(new Date(date));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden p-8 border border-border/50">
        <img src={guidesHeroBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-card/90 via-card/70 to-transparent" />
        <div className="relative max-w-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <Badge variant="outline" className="text-primary border-primary/30">Academy</Badge>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Guias e Manuais</h1>
          <p className="text-muted-foreground text-lg">
            Documentação completa para te guiar em cada etapa da sua jornada na Max Capital.
          </p>
        </div>
      </div>

      {/* Featured guides */}
      {!searchQuery && !activeCategoria && destaques.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {destaques.map((guide, i) => (
            <motion.div
              key={guide.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="group border-border/50 hover:border-primary/50 transition-all duration-300 cursor-pointer overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex">
                    <div className="w-2 bg-primary flex-shrink-0" />
                    <div className="p-5 flex-1">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <guide.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-primary/10 text-primary text-xs border-0">Destaque</Badge>
                          </div>
                          <h3 className="font-semibold text-foreground text-lg group-hover:text-primary transition-colors">
                            {guide.titulo}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {guide.descricao}
                          </p>
                          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                            <span>{guide.paginas} páginas</span>
                            <span>·</span>
                            <span>{guide.formato}</span>
                            <span>·</span>
                            <span>Atualizado: {formatDate(guide.atualizado)}</span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar guias e manuais..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={activeCategoria === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategoria(null)}
          >
            <Filter className="h-4 w-4 mr-1" />
            Todos
          </Button>
          {categoriasGuias.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategoria === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategoria(activeCategoria === cat.id ? null : cat.id)}
            >
              {cat.nome}
            </Button>
          ))}
        </div>
      </div>

      {/* Guides list */}
      <p className="text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? 'guia' : 'guias'} encontrado{filtered.length !== 1 && 's'}
      </p>

      {filtered.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((guide, i) => (
            <motion.div
              key={guide.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="group border-border/50 hover:border-primary/50 transition-all duration-300 h-full flex flex-col">
                <CardContent className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-muted/50 group-hover:bg-primary/10 flex items-center justify-center flex-shrink-0 transition-colors">
                      <guide.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {guide.titulo}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{guide.formato}</Badge>
                        <span className="text-xs text-muted-foreground">{guide.paginas} pág.</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {guide.descricao}
                  </p>

                  <div className="mt-auto">
                    <div className="text-xs text-muted-foreground mb-3 pt-3 border-t border-border/50">
                      Atualizado: {formatDate(guide.atualizado)}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                        <Eye className="h-3.5 w-3.5" />
                        Ler
                      </Button>
                      <Button size="sm" className="flex-1 gap-1.5">
                        <Download className="h-3.5 w-3.5" />
                        Baixar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Nenhum guia encontrado</h3>
            <p className="text-muted-foreground max-w-sm">Tente ajustar sua pesquisa ou filtros.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => { setSearchQuery(''); setActiveCategoria(null); }}
            >
              Limpar filtros
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
