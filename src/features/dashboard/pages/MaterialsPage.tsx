import { useState } from 'react';
import { 
  Search, 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Presentation, 
  File,
  FolderOpen,
  Loader2,
  Package,
  Eye,
  Filter,
} from 'lucide-react';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/card';
import { Badge } from '@/shared/components/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useMateriais, useIncrementDownload } from '@/hooks/useMateriais';
import { toast } from 'sonner';
import { useConfigImage } from '@/hooks/useConfigImages';

const categorias = [
  { id: 'playbooks', nome: 'Playbooks', icon: FileText, color: 'text-primary' },
  { id: 'templates', nome: 'Templates', icon: FileSpreadsheet, color: 'text-info' },
  { id: 'scripts', nome: 'Scripts', icon: File, color: 'text-warning' },
  { id: 'apresentacoes', nome: 'Apresentações', icon: Presentation, color: 'text-primary' },
];

export default function MaterialsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoria, setActiveCategoria] = useState<string | null>(null);
  const materialsHeroBg = useConfigImage('img_materiais_hero');
  
  const { data: materiais = [], isLoading } = useMateriais();
  const incrementDownload = useIncrementDownload();

  const handleView = (url?: string | null) => {
    if (!url) return toast.error('Arquivo não disponível para visualização.');
    window.open(url, '_blank');
  };

  const handleDownload = async (material: typeof materiais[number]) => {
    if (!material.arquivo_url) return toast.error('Arquivo não disponível para download.');
    try {
      const response = await fetch(material.arquivo_url);
      const blob = await response.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = material.nome || 'arquivo';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      incrementDownload.mutate(material.id);
      toast.success('Download iniciado!');
    } catch {
      // Fallback: open in new tab
      window.open(material.arquivo_url, '_blank');
      incrementDownload.mutate(material.id);
    }
  };

  const filteredMateriais = materiais.filter(material => {
    const matchesSearch = material.nome.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategoria = activeCategoria ? material.categoria === activeCategoria : true;
    return matchesSearch && matchesCategoria;
  });

  const formatDate = (date: string) => new Intl.DateTimeFormat('pt-BR').format(new Date(date));

  const getIconConfig = (categoria: string) => {
    return categorias.find(c => c.id === categoria) || { icon: File, color: 'text-muted-foreground' };
  };

  const categoriasComContagem = categorias.map(cat => ({
    ...cat,
    total: materiais.filter(m => m.categoria === cat.id).length,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden p-8 border border-border/50">
        <img src={materialsHeroBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-card/90 via-card/70 to-transparent" />
        <div className="relative max-w-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <Badge variant="outline" className="text-primary border-primary/30">Academy</Badge>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Kit Comercial</h1>
          <p className="text-muted-foreground text-lg">
            Playbooks, templates, scripts e apresentações para apoiar sua originação de negócios.
          </p>
        </div>
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categoriasComContagem.map((cat, i) => (
          <Card 
            key={cat.id} 
            className={cn(
              "border-border/50 cursor-pointer transition-all hover:border-primary/50",
              activeCategoria === cat.id && "border-primary/50 bg-primary/5"
            )}
            onClick={() => setActiveCategoria(activeCategoria === cat.id ? null : cat.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{cat.nome}</p>
                  <p className={cn('text-2xl font-bold', cat.color)}>{cat.total}</p>
                </div>
                <cat.icon className={cn('h-8 w-8 opacity-20', cat.color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar materiais..."
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
            Todos ({materiais.length})
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando materiais...</p>
        </div>
      ) : filteredMateriais.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">
            {filteredMateriais.length} {filteredMateriais.length === 1 ? 'material' : 'materiais'} encontrado{filteredMateriais.length !== 1 && 's'}
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMateriais.map((material, i) => {
              const config = getIconConfig(material.categoria || '');
              const Icon = config.icon;
              return (
                <motion.div
                  key={material.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="group border-border/50 hover:border-primary/50 transition-all duration-300 h-full flex flex-col">
                    {/* Header with icon */}
                    <div className="p-4 pb-0">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0",
                          "bg-muted/50 group-hover:bg-primary/10 transition-colors"
                        )}>
                          <Icon className={cn("h-6 w-6", config.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {material.nome}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {material.formato || 'PDF'}
                            </Badge>
                            {material.tamanho && (
                              <span className="text-xs text-muted-foreground">{material.tamanho}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-4 flex-1 flex flex-col">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-3 border-t border-border/50">
                        <span className="flex items-center gap-1">
                          <Download className="h-3.5 w-3.5" />
                          {material.downloads || 0} downloads
                        </span>
                        {material.atualizado_em && (
                          <span>Atualizado: {formatDate(material.atualizado_em)}</span>
                        )}
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1 gap-1.5"
                          onClick={() => handleView(material.arquivo_url)}
                          disabled={!material.arquivo_url}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Visualizar
                        </Button>
                        <Button 
                          size="sm"
                          className="flex-1 gap-1.5"
                          onClick={() => handleDownload(material)}
                          disabled={!material.arquivo_url || incrementDownload.isPending}
                        >
                          <Download className="h-3.5 w-3.5" />
                          Baixar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </>
      ) : (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Nenhum material encontrado</h3>
            <p className="text-muted-foreground max-w-sm">
              {materiais.length === 0
                ? 'Nenhum material cadastrado no sistema.'
                : 'Tente ajustar sua pesquisa ou filtros.'}
            </p>
            {(searchQuery || activeCategoria) && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => { setSearchQuery(''); setActiveCategoria(null); }}
              >
                Limpar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
