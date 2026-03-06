import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, Package, BookOpen, Plus, Pencil, Trash2, Search, Play, FileText,
  Eye, EyeOff, Loader2, Clock, BarChart3, FolderOpen, ImageIcon, ArrowLeft, GripVertical,
} from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FileUploadField } from '@/features/admin/components/FileUploadField';
import { Card, CardContent } from '@/shared/components/card';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { Badge } from '@/shared/components/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/shared/components/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/shared/components/select';
import { Textarea } from '@/shared/components/textarea';
import { Switch } from '@/shared/components/switch';
import { Label } from '@/shared/components/label';
import { AdminBreadcrumb } from '@/features/admin/components/AdminBreadcrumb';
import { cn } from '@/lib/utils';
import { toast } from '@/shared/hooks/use-toast';
import { useCategorias, type CategoriaTraining } from '@/hooks/useCategorias';
import { useAdminLogs } from '@/hooks/useAdminLogs';
type Categoria = CategoriaTraining;

interface Curso {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  duracao: string;
  nivel: string;
  video_url: string;
  thumbnail_url: string;
  ativo: boolean;
  ordem: number;
}

interface Material {
  id: string;
  nome: string;
  categoria: string;
  formato: string;
  tamanho: string;
  arquivo_url: string;
  ativo: boolean;
}

interface Guia {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  formato: string;
  paginas: number;
  arquivo_url: string;
  ativo: boolean;
}

type ActiveTab = 'cursos' | 'materiais' | 'guias';

// ─── Mock data ───
const mockCursos: Curso[] = [
  { id: '1', titulo: 'Introdução à Originação', descricao: 'Fundamentos de originação de negócios', categoria: 'Fundamentos', duracao: '45 min', nivel: 'Iniciante', video_url: '', thumbnail_url: '', ativo: true, ordem: 1 },
  { id: '2', titulo: 'Análise de Crédito Avançada', descricao: 'Técnicas avançadas de análise', categoria: 'Crédito', duracao: '1h 30min', nivel: 'Avançado', video_url: '', thumbnail_url: '', ativo: true, ordem: 2 },
  { id: '3', titulo: 'Negociação com Clientes', descricao: 'Estratégias de negociação', categoria: 'Vendas', duracao: '1h', nivel: 'Intermediário', video_url: '', thumbnail_url: '', ativo: false, ordem: 3 },
];

const mockMateriais: Material[] = [
  { id: '1', nome: 'Playbook de Prospecção', categoria: 'playbooks', formato: 'PDF', tamanho: '2.4 MB', arquivo_url: '', ativo: true },
  { id: '2', nome: 'Template de Proposta Comercial', categoria: 'templates', formato: 'DOCX', tamanho: '1.1 MB', arquivo_url: '', ativo: true },
];

const mockGuias: Guia[] = [
  { id: '1', titulo: 'Guia do Originador', descricao: 'Manual completo para originadores', categoria: 'originacao', formato: 'PDF', paginas: 45, arquivo_url: '', ativo: true },
  { id: '2', titulo: 'Manual de Compliance', descricao: 'Diretrizes de compliance', categoria: 'compliance', formato: 'PDF', paginas: 32, arquivo_url: '', ativo: true },
];

// ─── Component ───
export default function AdminCursos() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('cursos');
  const [searchQuery, setSearchQuery] = useState('');

  // Categorias state (shared store)
  const { categorias, setCategorias: setCategoriasStore } = useCategorias();
  const { logAction } = useAdminLogs();
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);

  // Cursos state
  const [cursos, setCursos] = useState<Curso[]>(mockCursos);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [showCursoModal, setShowCursoModal] = useState(false);

  // Materiais state
  const [materiais, setMateriais] = useState<Material[]>(mockMateriais);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [showMaterialModal, setShowMaterialModal] = useState(false);

  // Guias state
  const [guias, setGuias] = useState<Guia[]>(mockGuias);
  const [editingGuia, setEditingGuia] = useState<Guia | null>(null);
  const [showGuiaModal, setShowGuiaModal] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string } | null>(null);

  const categoriaNomes = categorias.map(c => c.nome);

  const cursosFiltered = useMemo(() => {
    let list = cursos;
    if (selectedCategoria) list = list.filter(c => c.categoria === selectedCategoria);
    if (searchQuery) list = list.filter(c => c.titulo.toLowerCase().includes(searchQuery.toLowerCase()));
    return list;
  }, [cursos, selectedCategoria, searchQuery]);

  const tabs = [
    { key: 'cursos' as const, label: 'Treinamentos', icon: GraduationCap, count: cursos.length },
    { key: 'materiais' as const, label: 'Kit Comercial', icon: Package, count: materiais.length },
    { key: 'guias' as const, label: 'Guias e Manuais', icon: BookOpen, count: guias.length },
  ];

  // ─── CRUD ───
  const handleSaveCategoria = (cat: Categoria) => {
    const isEdit = !!categorias.find(c => c.id === cat.id);
    if (isEdit) {
      const oldCat = categorias.find(c => c.id === cat.id);
      setCategoriasStore(categorias.map(c => c.id === cat.id ? cat : c));
      if (oldCat && oldCat.nome !== cat.nome) {
        setCursos(prev => prev.map(c => c.categoria === oldCat.nome ? { ...c, categoria: cat.nome } : c));
      }
      toast({ title: 'Categoria atualizada', description: cat.nome });
      logAction({ acao: 'editar', recurso: 'categorias', recurso_id: cat.id, descricao: `Categoria "${cat.nome}" atualizada`, dados_anteriores: oldCat as any, dados_novos: cat as any });
    } else {
      const newId = crypto.randomUUID();
      setCategoriasStore([...categorias, { ...cat, id: newId }]);
      toast({ title: 'Categoria criada', description: cat.nome });
      logAction({ acao: 'criar', recurso: 'categorias', recurso_id: newId, descricao: `Categoria "${cat.nome}" criada` });
    }
    setShowCategoriaModal(false);
    setEditingCategoria(null);
  };

  const handleSaveCurso = (curso: Curso) => {
    const isEdit = !!cursos.find(c => c.id === curso.id);
    if (isEdit) {
      const oldCurso = cursos.find(c => c.id === curso.id);
      setCursos(prev => prev.map(c => c.id === curso.id ? curso : c));
      toast({ title: 'Curso atualizado', description: curso.titulo });
      logAction({ acao: 'editar', recurso: 'cursos', recurso_id: curso.id, descricao: `Curso "${curso.titulo}" atualizado`, dados_anteriores: oldCurso as any, dados_novos: curso as any });
    } else {
      const newId = crypto.randomUUID();
      setCursos(prev => [...prev, { ...curso, id: newId }]);
      toast({ title: 'Curso criado', description: curso.titulo });
      logAction({ acao: 'criar', recurso: 'cursos', recurso_id: newId, descricao: `Curso "${curso.titulo}" criado` });
    }
    setShowCursoModal(false);
    setEditingCurso(null);
  };

  const handleSaveMaterial = (material: Material) => {
    if (materiais.find(m => m.id === material.id)) {
      setMateriais(prev => prev.map(m => m.id === material.id ? material : m));
      toast({ title: 'Material atualizado', description: material.nome });
    } else {
      setMateriais(prev => [...prev, { ...material, id: crypto.randomUUID() }]);
      toast({ title: 'Material criado', description: material.nome });
    }
    setShowMaterialModal(false);
    setEditingMaterial(null);
  };

  const handleSaveGuia = (guia: Guia) => {
    if (guias.find(g => g.id === guia.id)) {
      setGuias(prev => prev.map(g => g.id === guia.id ? guia : g));
      toast({ title: 'Guia atualizado', description: guia.titulo });
    } else {
      setGuias(prev => [...prev, { ...guia, id: crypto.randomUUID() }]);
      toast({ title: 'Guia criado', description: guia.titulo });
    }
    setShowGuiaModal(false);
    setEditingGuia(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'categorias') setCategoriasStore(categorias.filter(c => c.id !== deleteTarget.id));
    if (deleteTarget.type === 'cursos') setCursos(prev => prev.filter(c => c.id !== deleteTarget.id));
    if (deleteTarget.type === 'materiais') setMateriais(prev => prev.filter(m => m.id !== deleteTarget.id));
    if (deleteTarget.type === 'guias') setGuias(prev => prev.filter(g => g.id !== deleteTarget.id));
    toast({ title: 'Item excluído', description: deleteTarget.name });
    logAction({ acao: 'deletar', recurso: deleteTarget.type, recurso_id: deleteTarget.id, descricao: `${deleteTarget.name} excluído` });
    setDeleteTarget(null);
  };

  const getNewAction = () => {
    if (activeTab === 'cursos' && !selectedCategoria) { setEditingCategoria(null); setShowCategoriaModal(true); return; }
    if (activeTab === 'cursos') { setEditingCurso(null); setShowCursoModal(true); }
    if (activeTab === 'materiais') { setEditingMaterial(null); setShowMaterialModal(true); }
    if (activeTab === 'guias') { setEditingGuia(null); setShowGuiaModal(true); }
  };

  const getNewLabel = () => {
    if (activeTab === 'cursos' && !selectedCategoria) return 'Nova Categoria';
    if (activeTab === 'cursos') return 'Novo Curso';
    if (activeTab === 'materiais') return 'Novo Material';
    return 'Novo Guia';
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <AdminBreadcrumb items={[{ label: 'Academy' }]} />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Academy</h1>
          <p className="text-muted-foreground">Gerencie categorias, treinamentos, kit comercial, guias e manuais</p>
        </div>
        <Button className="gap-2" onClick={getNewAction}>
          <Plus className="h-4 w-4" />
          {getNewLabel()}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setActiveTab(tab.key); setSearchQuery(''); setSelectedCategoria(null); }}
            className="gap-2"
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{tab.count}</Badge>
          </Button>
        ))}
      </div>

      {/* Search */}
      {(activeTab !== 'cursos' || selectedCategoria) && (
        <div className="flex gap-3 items-center">
          {activeTab === 'cursos' && selectedCategoria && (
            <Button variant="outline" size="sm" onClick={() => setSelectedCategoria(null)} className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              Todas categorias
            </Button>
          )}
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'cursos' && !selectedCategoria && (
          <motion.div key="categorias" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CategoriasGrid
              categorias={categorias}
              cursosCount={(nome) => cursos.filter(c => c.categoria === nome).length}
              onEdit={(c) => { setEditingCategoria(c); setShowCategoriaModal(true); }}
              onDelete={(c) => setDeleteTarget({ type: 'categorias', id: c.id, name: c.nome })}
              onSelect={(nome) => { setSelectedCategoria(nome); }}
              onReorder={(reordered) => setCategoriasStore(reordered)}
            />
          </motion.div>
        )}
        {activeTab === 'cursos' && selectedCategoria && (
          <motion.div key="cursos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CursosTable
              cursos={cursosFiltered}
              onEdit={(c) => { setEditingCurso(c); setShowCursoModal(true); }}
              onDelete={(c) => setDeleteTarget({ type: 'cursos', id: c.id, name: c.titulo })}
              onToggle={(id) => setCursos(prev => prev.map(c => c.id === id ? { ...c, ativo: !c.ativo } : c))}
            />
          </motion.div>
        )}
        {activeTab === 'materiais' && (
          <motion.div key="materiais" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <MateriaisTable
              materiais={materiais.filter(m => m.nome.toLowerCase().includes(searchQuery.toLowerCase()))}
              onEdit={(m) => { setEditingMaterial(m); setShowMaterialModal(true); }}
              onDelete={(m) => setDeleteTarget({ type: 'materiais', id: m.id, name: m.nome })}
              onToggle={(id) => setMateriais(prev => prev.map(m => m.id === id ? { ...m, ativo: !m.ativo } : m))}
            />
          </motion.div>
        )}
        {activeTab === 'guias' && (
          <motion.div key="guias" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GuiasTable
              guias={guias.filter(g => g.titulo.toLowerCase().includes(searchQuery.toLowerCase()))}
              onEdit={(g) => { setEditingGuia(g); setShowGuiaModal(true); }}
              onDelete={(g) => setDeleteTarget({ type: 'guias', id: g.id, name: g.titulo })}
              onToggle={(id) => setGuias(prev => prev.map(g => g.id === id ? { ...g, ativo: !g.ativo } : g))}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <CategoriaFormModal open={showCategoriaModal} onClose={() => { setShowCategoriaModal(false); setEditingCategoria(null); }} categoria={editingCategoria} onSave={handleSaveCategoria} />
      <CursoFormModal open={showCursoModal} onClose={() => { setShowCursoModal(false); setEditingCurso(null); }} curso={editingCurso} onSave={handleSaveCurso} categorias={categoriaNomes} />
      <MaterialFormModal open={showMaterialModal} onClose={() => { setShowMaterialModal(false); setEditingMaterial(null); }} material={editingMaterial} onSave={handleSaveMaterial} />
      <GuiaFormModal open={showGuiaModal} onClose={() => { setShowGuiaModal(false); setEditingGuia(null); }} guia={editingGuia} onSave={handleSaveGuia} />

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <strong>{deleteTarget?.name}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ─── Sortable Category Card ───
function SortableCategoriaCard({ cat, index, cursosCount, onEdit, onDelete, onSelect }: {
  cat: Categoria;
  index: number;
  cursosCount: number;
  onEdit: (c: Categoria) => void;
  onDelete: (c: Categoria) => void;
  onSelect: (nome: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="group overflow-hidden border-border/40 hover:border-primary/40 transition-all cursor-pointer relative" onClick={() => onSelect(cat.nome)}>
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 z-10 p-1 rounded bg-card/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          onClick={e => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        {/* Image */}
        <div className="relative h-32 bg-gradient-to-br from-muted via-muted/50 to-transparent overflow-hidden">
          {cat.imagem_url ? (
            <img src={cat.imagem_url} alt={cat.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
          {!cat.ativo && (
            <Badge variant="secondary" className="absolute top-2 left-2 text-xs">Inativa</Badge>
          )}
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">{cat.nome}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{cat.descricao || 'Sem descrição'}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs gap-1">
                  <GraduationCap className="h-3 w-3" />
                  {cursosCount} {cursosCount === 1 ? 'curso' : 'cursos'}
                </Badge>
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(cat)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(cat)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Categorias Grid ───
function CategoriasGrid({ categorias, cursosCount, onEdit, onDelete, onSelect, onReorder }: {
  categorias: Categoria[];
  cursosCount: (nome: string) => number;
  onEdit: (c: Categoria) => void;
  onDelete: (c: Categoria) => void;
  onSelect: (nome: string) => void;
  onReorder: (cats: Categoria[]) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = categorias.findIndex(c => c.id === active.id);
    const newIndex = categorias.findIndex(c => c.id === over.id);
    const reordered = arrayMove(categorias, oldIndex, newIndex).map((c, i) => ({ ...c, ordem: i + 1 }));
    onReorder(reordered);
  };

  if (categorias.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>Nenhuma categoria criada</p>
        <p className="text-sm mt-1">Crie categorias para organizar seus treinamentos</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={categorias.map(c => c.id)} strategy={rectSortingStrategy}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categorias.map((cat, i) => (
            <SortableCategoriaCard
              key={cat.id}
              cat={cat}
              index={i}
              cursosCount={cursosCount(cat.nome)}
              onEdit={onEdit}
              onDelete={onDelete}
              onSelect={onSelect}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// ─── Cursos Table ───
function CursosTable({ cursos, onEdit, onDelete, onToggle }: {
  cursos: Curso[];
  onEdit: (c: Curso) => void;
  onDelete: (c: Curso) => void;
  onToggle: (id: string) => void;
}) {
  return (
    <Card className="border-0">
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {cursos.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">Nenhum curso encontrado</div>
          )}
          {cursos.map((curso, i) => (
            <motion.div
              key={curso.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              {/* Thumbnail preview */}
              <div className="h-12 w-20 rounded-lg bg-muted/50 overflow-hidden flex-shrink-0">
                {curso.thumbnail_url ? (
                  <img src={curso.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="h-5 w-5 text-primary/40" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground truncate">{curso.titulo}</p>
                  <Badge variant="outline" className="text-xs">{curso.categoria}</Badge>
                  {!curso.ativo && <Badge variant="secondary" className="text-xs">Inativo</Badge>}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{curso.duracao}</span>
                  <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" />{curso.nivel}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onToggle(curso.id)}>
                  {curso.ativo ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(curso)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(curso)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Materiais Table ───
function MateriaisTable({ materiais, onEdit, onDelete, onToggle }: {
  materiais: Material[];
  onEdit: (m: Material) => void;
  onDelete: (m: Material) => void;
  onToggle: (id: string) => void;
}) {
  return (
    <Card className="border-0">
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {materiais.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">Nenhum material encontrado</div>
          )}
          {materiais.map((material, i) => (
            <motion.div
              key={material.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-info" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground truncate">{material.nome}</p>
                  <Badge variant="outline" className="text-xs">{material.categoria}</Badge>
                  {!material.ativo && <Badge variant="secondary" className="text-xs">Inativo</Badge>}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  <span>{material.formato}</span>
                  <span>{material.tamanho}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onToggle(material.id)}>
                  {material.ativo ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(material)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(material)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Guias Table ───
function GuiasTable({ guias, onEdit, onDelete, onToggle }: {
  guias: Guia[];
  onEdit: (g: Guia) => void;
  onDelete: (g: Guia) => void;
  onToggle: (id: string) => void;
}) {
  return (
    <Card className="border-0">
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {guias.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">Nenhum guia encontrado</div>
          )}
          {guias.map((guia, i) => (
            <motion.div
              key={guia.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground truncate">{guia.titulo}</p>
                  <Badge variant="outline" className="text-xs">{guia.categoria}</Badge>
                  {!guia.ativo && <Badge variant="secondary" className="text-xs">Inativo</Badge>}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  <span>{guia.formato}</span>
                  <span>{guia.paginas} páginas</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onToggle(guia.id)}>
                  {guia.ativo ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(guia)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(guia)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Form Modals ───

function CategoriaFormModal({ open, onClose, categoria, onSave }: {
  open: boolean;
  onClose: () => void;
  categoria: Categoria | null;
  onSave: (c: Categoria) => void;
}) {
  const [form, setForm] = useState<Categoria>(
    categoria || { id: '', nome: '', descricao: '', imagem_url: '', ordem: 0, ativo: true }
  );

  const handleOpen = () => {
    setForm(categoria || { id: '', nome: '', descricao: '', imagem_url: '', ordem: 0, ativo: true });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg" onOpenAutoFocus={handleOpen}>
        <DialogHeader>
          <DialogTitle>{categoria ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          <DialogDescription>Configure a categoria de treinamento</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Nome da Categoria</Label>
            <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Compliance, Vendas, Operações" />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Breve descrição da categoria" rows={2} />
          </div>
          <FileUploadField
            label="Imagem de Capa"
            value={form.imagem_url}
            onChange={v => setForm(f => ({ ...f, imagem_url: v }))}
            accept="image/*"
            placeholder="https://exemplo.com/imagem.jpg"
          />
          {form.imagem_url && (
            <div className="rounded-lg overflow-hidden border border-border h-32">
              <img src={form.imagem_url} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ordem</Label>
              <Input type="number" value={form.ordem} onChange={e => setForm(f => ({ ...f, ordem: Number(e.target.value) }))} />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={form.ativo} onCheckedChange={v => setForm(f => ({ ...f, ativo: v }))} />
              <Label>Ativa</Label>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => onSave(form)} disabled={!form.nome}>Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CursoFormModal({ open, onClose, curso, onSave, categorias }: {
  open: boolean;
  onClose: () => void;
  curso: Curso | null;
  onSave: (c: Curso) => void;
  categorias: string[];
}) {
  const [form, setForm] = useState<Curso>(
    curso || { id: '', titulo: '', descricao: '', categoria: categorias[0] || '', duracao: '', nivel: 'Iniciante', video_url: '', thumbnail_url: '', ativo: true, ordem: 0 }
  );

  const handleOpen = () => {
    setForm(curso || { id: '', titulo: '', descricao: '', categoria: categorias[0] || '', duracao: '', nivel: 'Iniciante', video_url: '', thumbnail_url: '', ativo: true, ordem: 0 });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg" onOpenAutoFocus={handleOpen}>
        <DialogHeader>
          <DialogTitle>{curso ? 'Editar Curso' : 'Novo Curso'}</DialogTitle>
          <DialogDescription>Preencha os dados do treinamento</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Nome do curso" />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Descrição do curso" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={v => setForm(f => ({ ...f, categoria: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categorias.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duração</Label>
              <Input value={form.duracao} onChange={e => setForm(f => ({ ...f, duracao: e.target.value }))} placeholder="Ex: 1h 30min" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nível</Label>
              <Select value={form.nivel} onValueChange={v => setForm(f => ({ ...f, nivel: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Iniciante">Iniciante</SelectItem>
                  <SelectItem value="Intermediário">Intermediário</SelectItem>
                  <SelectItem value="Avançado">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ordem</Label>
              <Input type="number" value={form.ordem} onChange={e => setForm(f => ({ ...f, ordem: Number(e.target.value) }))} />
            </div>
          </div>
          <FileUploadField
            label="Thumbnail do Curso"
            value={form.thumbnail_url}
            onChange={v => setForm(f => ({ ...f, thumbnail_url: v }))}
            accept="image/*"
            placeholder="https://exemplo.com/thumb.jpg"
          />
          <FileUploadField
            label="Vídeo"
            value={form.video_url}
            onChange={v => setForm(f => ({ ...f, video_url: v }))}
            accept="video/*"
            placeholder="https://exemplo.com/video.mp4"
          />
          <div className="flex items-center gap-3">
            <Switch checked={form.ativo} onCheckedChange={v => setForm(f => ({ ...f, ativo: v }))} />
            <Label>Ativo (visível para usuários)</Label>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => onSave(form)} disabled={!form.titulo || !form.categoria}>Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MaterialFormModal({ open, onClose, material, onSave }: {
  open: boolean;
  onClose: () => void;
  material: Material | null;
  onSave: (m: Material) => void;
}) {
  const [form, setForm] = useState<Material>(
    material || { id: '', nome: '', categoria: 'playbooks', formato: 'PDF', tamanho: '', arquivo_url: '', ativo: true }
  );
  const handleOpen = () => {
    setForm(material || { id: '', nome: '', categoria: 'playbooks', formato: 'PDF', tamanho: '', arquivo_url: '', ativo: true });
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg" onOpenAutoFocus={handleOpen}>
        <DialogHeader>
          <DialogTitle>{material ? 'Editar Material' : 'Novo Material'}</DialogTitle>
          <DialogDescription>Preencha os dados do material do kit comercial</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome do material" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={v => setForm(f => ({ ...f, categoria: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="playbooks">Playbooks</SelectItem>
                  <SelectItem value="templates">Templates</SelectItem>
                  <SelectItem value="scripts">Scripts</SelectItem>
                  <SelectItem value="apresentacoes">Apresentações</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Formato</Label>
              <Select value={form.formato} onValueChange={v => setForm(f => ({ ...f, formato: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="DOCX">DOCX</SelectItem>
                  <SelectItem value="XLSX">XLSX</SelectItem>
                  <SelectItem value="PPTX">PPTX</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tamanho</Label>
            <Input value={form.tamanho} onChange={e => setForm(f => ({ ...f, tamanho: e.target.value }))} placeholder="Ex: 2.4 MB" />
          </div>
          <FileUploadField
            label="Arquivo"
            value={form.arquivo_url}
            onChange={v => setForm(f => ({ ...f, arquivo_url: v }))}
            accept=".pdf,.docx,.xlsx,.pptx"
            placeholder="https://exemplo.com/arquivo.pdf"
          />
          <div className="flex items-center gap-3">
            <Switch checked={form.ativo} onCheckedChange={v => setForm(f => ({ ...f, ativo: v }))} />
            <Label>Ativo</Label>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => onSave(form)} disabled={!form.nome}>Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GuiaFormModal({ open, onClose, guia, onSave }: {
  open: boolean;
  onClose: () => void;
  guia: Guia | null;
  onSave: (g: Guia) => void;
}) {
  const [form, setForm] = useState<Guia>(
    guia || { id: '', titulo: '', descricao: '', categoria: 'originacao', formato: 'PDF', paginas: 0, arquivo_url: '', ativo: true }
  );
  const handleOpen = () => {
    setForm(guia || { id: '', titulo: '', descricao: '', categoria: 'originacao', formato: 'PDF', paginas: 0, arquivo_url: '', ativo: true });
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg" onOpenAutoFocus={handleOpen}>
        <DialogHeader>
          <DialogTitle>{guia ? 'Editar Guia' : 'Novo Guia'}</DialogTitle>
          <DialogDescription>Preencha os dados do guia ou manual</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Nome do guia" />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Descrição do guia" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={v => setForm(f => ({ ...f, categoria: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="originacao">Originação</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="analise">Análise</SelectItem>
                  <SelectItem value="plataforma">Plataforma</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Páginas</Label>
              <Input type="number" value={form.paginas} onChange={e => setForm(f => ({ ...f, paginas: Number(e.target.value) }))} />
            </div>
          </div>
          <FileUploadField
            label="Arquivo"
            value={form.arquivo_url}
            onChange={v => setForm(f => ({ ...f, arquivo_url: v }))}
            accept=".pdf,.docx,.xlsx,.pptx"
            placeholder="https://exemplo.com/guia.pdf"
          />
          <div className="flex items-center gap-3">
            <Switch checked={form.ativo} onCheckedChange={v => setForm(f => ({ ...f, ativo: v }))} />
            <Label>Ativo</Label>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => onSave(form)} disabled={!form.titulo}>Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
