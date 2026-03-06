/**
 * AdminFormularios - 4-level form management: Setores → Segmentos → Formulários → Editor
 * Supports CRUD for setores, segmentos, and forms.
 * Only one form can be active per segment.
 */
import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, FileText, Layers, FolderOpen,
  CheckCircle2, AlertCircle, Plus, Edit, Trash2, X, Check,
  Power, PowerOff, Copy,
  icons,
} from 'lucide-react';

/** Render a Lucide icon by its name string */
function LucideIcon({ name, className }: { name: string; className?: string }) {
  const IconComp = (icons as Record<string, React.ComponentType<{ className?: string }>>)[name];
  if (!IconComp) return <FileText className={className} />;
  return <IconComp className={className} />;
}
import { FormBuilderEditor } from '@/features/admin/components/FormBuilder';
import { Card, CardContent } from '@/shared/components/card';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { Textarea } from '@/shared/components/textarea';
import { Badge } from '@/shared/components/badge';
import { Label } from '@/shared/components/label';
import { Switch } from '@/shared/components/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/shared/components/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/shared/components/alert-dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AdminBreadcrumb } from '@/features/admin/components/AdminBreadcrumb';
import { getDefaultBlocksForSector } from '@/features/admin/components/FormBuilder/defaultBlocks';
import type { FormBlock } from '@/features/admin/components/FormBuilder/types';
import {
  getSetores, getSegmentos, getSetorLabel, getSetorIcon, getSegmentoLabel,
  addSetor, editSetor, deleteSetor,
  addSegmento, editSegmento, deleteSegmento,
  slugify, SETORES_SEGMENTOS_EVENT,
  type SetorItem, type SegmentoItem,
} from '@/lib/setores-segmentos';
import {
  getForms, getFormBlocks, createForm, renameForm, deleteForm,
  setFormActive, saveFormBlocks, getActiveForm, countFormsWithBlocks,
  FORMS_CHANGED_EVENT, type FormEntry,
} from '@/lib/forms-registry';

// ─── Icon Picker (Lucide names) ─────────────────────────────────────────────

const ICON_OPTIONS = [
  'ClipboardList','Wheat','HardHat','Building2','Monitor','Briefcase','Package','Factory','Microscope','Target',
  'Rocket','Lightbulb','ShoppingCart','HeartPulse','BarChart3','Palette','Wrench','Zap','Globe','GraduationCap',
  'Home','Plane','Car','Tent','Landmark',
];

// ─── Component ──────────────────────────────────────────────────────────────

type ViewLevel = 'setores' | 'segmentos' | 'formularios' | 'editor';

export default function AdminFormularios() {
  const [viewLevel, setViewLevel] = useState<ViewLevel>('setores');
  const [selectedSetor, setSelectedSetor] = useState<string | null>(null);
  const [selectedSegmento, setSelectedSegmento] = useState<string | null>(null);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  // Setor modal
  const [setorModalOpen, setSetorModalOpen] = useState(false);
  const [editingSetor, setEditingSetor] = useState<SetorItem | null>(null);
  const [setorForm, setSetorForm] = useState({ label: '', icon: '📋' });

  // Segmento modal
  const [segmentoModalOpen, setSegmentoModalOpen] = useState(false);
  const [editingSegmento, setEditingSegmento] = useState<SegmentoItem | null>(null);
  const [segmentoForm, setSegmentoForm] = useState({ label: '', description: '' });

  // Form modal
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<FormEntry | null>(null);
  const [formName, setFormName] = useState('');

  // Delete confirmations
  const [deleteSetorTarget, setDeleteSetorTarget] = useState<string | null>(null);
  const [deleteSegmentoTarget, setDeleteSegmentoTarget] = useState<string | null>(null);
  const [deleteFormTarget, setDeleteFormTarget] = useState<string | null>(null);

  const reload = useCallback(() => setVersion(v => v + 1), []);

  useEffect(() => {
    window.addEventListener(SETORES_SEGMENTOS_EVENT, reload);
    window.addEventListener(FORMS_CHANGED_EVENT, reload);
    return () => {
      window.removeEventListener(SETORES_SEGMENTOS_EVENT, reload);
      window.removeEventListener(FORMS_CHANGED_EVENT, reload);
    };
  }, [reload]);

  const setores = useMemo(() => getSetores(), [version]);
  const segmentos = useMemo(() => selectedSetor ? getSegmentos(selectedSetor) : [], [selectedSetor, version]);
  const forms = useMemo(() => (selectedSetor && selectedSegmento) ? getForms(selectedSetor, selectedSegmento) : [], [selectedSetor, selectedSegmento, version]);

  // ─── Navigation ──────────────────────────────────────────────────

  const navigateToSetor = (setor: string) => {
    setSelectedSetor(setor);
    setSelectedSegmento(null);
    setSelectedFormId(null);
    setViewLevel('segmentos');
  };

  const navigateToSegmento = (segmento: string) => {
    if (!selectedSetor) return;
    setSelectedSegmento(segmento);
    setSelectedFormId(null);
    setViewLevel('formularios');
  };

  const navigateToEditor = (formId: string) => {
    setSelectedFormId(formId);
    setViewLevel('editor');
  };

  const navigateBack = () => {
    if (viewLevel === 'editor') { setSelectedFormId(null); setViewLevel('formularios'); }
    else if (viewLevel === 'formularios') { setSelectedSegmento(null); setViewLevel('segmentos'); }
    else if (viewLevel === 'segmentos') { setSelectedSetor(null); setViewLevel('setores'); }
  };

  const breadcrumbItems = useMemo(() => {
    const items: { label: string; href?: string }[] = [{ label: 'Formulários' }];
    if (selectedSetor) items.push({ label: getSetorLabel(selectedSetor) });
    if (selectedSegmento && selectedSetor) items.push({ label: getSegmentoLabel(selectedSetor, selectedSegmento) });
    if (selectedFormId) {
      const form = forms.find(f => f.id === selectedFormId);
      if (form) items.push({ label: form.name });
    }
    return items;
  }, [selectedSetor, selectedSegmento, selectedFormId, forms, version]);

  const handleSave = (blocks: FormBlock[]) => {
    if (!selectedSetor || !selectedSegmento || !selectedFormId) return;
    saveFormBlocks(selectedSetor, selectedSegmento, selectedFormId, blocks);
    setVersion(v => v + 1);
    toast.success('Formulário salvo com sucesso!');
  };

  // ─── Setor CRUD ──────────────────────────────────────────────────

  const openNewSetorModal = () => { setEditingSetor(null); setSetorForm({ label: '', icon: 'ClipboardList' }); setSetorModalOpen(true); };
  const openEditSetorModal = (setor: SetorItem, e: React.MouseEvent) => { e.stopPropagation(); setEditingSetor(setor); setSetorForm({ label: setor.label, icon: setor.icon }); setSetorModalOpen(true); };

  const handleSaveSetor = () => {
    if (!setorForm.label.trim()) { toast.error('Nome é obrigatório'); return; }
    if (editingSetor) {
      editSetor(editingSetor.value, { label: setorForm.label.trim(), icon: setorForm.icon });
      toast.success(`Setor "${setorForm.label}" atualizado`);
    } else {
      const value = slugify(setorForm.label);
      if (setores.some(s => s.value === value)) { toast.error('Já existe um setor com esse nome'); return; }
      addSetor({ value, label: setorForm.label.trim(), icon: setorForm.icon });
      toast.success(`Setor "${setorForm.label}" criado`);
    }
    setSetorModalOpen(false);
  };

  const confirmDeleteSetor = (value: string, e: React.MouseEvent) => { e.stopPropagation(); setDeleteSetorTarget(value); };
  const handleDeleteSetor = () => { if (!deleteSetorTarget) return; deleteSetor(deleteSetorTarget); toast.success('Setor removido'); setDeleteSetorTarget(null); };

  // ─── Segmento CRUD ───────────────────────────────────────────────

  const openNewSegmentoModal = () => { setEditingSegmento(null); setSegmentoForm({ label: '', description: '' }); setSegmentoModalOpen(true); };
  const openEditSegmentoModal = (seg: SegmentoItem, e: React.MouseEvent) => { e.stopPropagation(); setEditingSegmento(seg); setSegmentoForm({ label: seg.label, description: seg.description }); setSegmentoModalOpen(true); };

  const handleSaveSegmento = () => {
    if (!selectedSetor || !segmentoForm.label.trim()) { toast.error('Nome é obrigatório'); return; }
    if (editingSegmento) {
      editSegmento(selectedSetor, editingSegmento.value, { label: segmentoForm.label.trim(), description: segmentoForm.description.trim() });
      toast.success(`Segmento "${segmentoForm.label}" atualizado`);
    } else {
      const value = slugify(segmentoForm.label);
      if (segmentos.some(s => s.value === value)) { toast.error('Já existe um segmento com esse nome'); return; }
      addSegmento(selectedSetor, { value, label: segmentoForm.label.trim(), description: segmentoForm.description.trim() });
      toast.success(`Segmento "${segmentoForm.label}" criado`);
    }
    setSegmentoModalOpen(false);
  };

  const confirmDeleteSegmento = (value: string, e: React.MouseEvent) => { e.stopPropagation(); setDeleteSegmentoTarget(value); };
  const handleDeleteSegmento = () => { if (!deleteSegmentoTarget || !selectedSetor) return; deleteSegmento(selectedSetor, deleteSegmentoTarget); toast.success('Segmento removido'); setDeleteSegmentoTarget(null); };

  // ─── Form CRUD ───────────────────────────────────────────────────

  const openNewFormModal = () => { setEditingForm(null); setFormName(''); setFormModalOpen(true); };
  const openEditFormModal = (form: FormEntry, e: React.MouseEvent) => { e.stopPropagation(); setEditingForm(form); setFormName(form.name); setFormModalOpen(true); };

  const handleSaveForm = () => {
    if (!selectedSetor || !selectedSegmento || !formName.trim()) { toast.error('Nome é obrigatório'); return; }
    if (editingForm) {
      renameForm(selectedSetor, selectedSegmento, editingForm.id, formName.trim());
      toast.success(`Formulário renomeado para "${formName}"`);
    } else {
      const defaults = getDefaultBlocksForSector(selectedSetor);
      createForm(selectedSetor, selectedSegmento, formName.trim(), defaults);
      toast.success(`Formulário "${formName}" criado`);
    }
    setFormModalOpen(false);
  };

  const handleToggleActive = (formId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedSetor || !selectedSegmento) return;
    setFormActive(selectedSetor, selectedSegmento, formId);
    toast.success('Formulário ativado');
  };

  const confirmDeleteForm = (formId: string, e: React.MouseEvent) => { e.stopPropagation(); setDeleteFormTarget(formId); };
  const handleDeleteForm = () => {
    if (!deleteFormTarget || !selectedSetor || !selectedSegmento) return;
    deleteForm(selectedSetor, selectedSegmento, deleteFormTarget);
    toast.success('Formulário removido');
    setDeleteFormTarget(null);
  };

  const handleDuplicateForm = (form: FormEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedSetor || !selectedSegmento) return;
    const blocks = getFormBlocks(selectedSetor, selectedSegmento, form.id);
    createForm(selectedSetor, selectedSegmento, `${form.name} (cópia)`, blocks);
    toast.success('Formulário duplicado');
  };

  // ─── Render Setores ──────────────────────────────────────────────

  const renderSetores = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Formulários por Setor</h2>
          <p className="text-sm text-muted-foreground mt-1">Gerencie formulários para cada setor e segmento.</p>
        </div>
        <Button size="sm" onClick={openNewSetorModal} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Novo Setor
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {setores.map((setor) => {
          const segs = getSegmentos(setor.value);
          let totalForms = 0;
          segs.forEach(seg => { totalForms += getForms(setor.value, seg.value).length; });

          return (
            <motion.div key={setor.value} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <Card className="cursor-pointer hover:shadow-md transition-all group relative border-0 shadow-none bg-card/50" onClick={() => navigateToSetor(setor.value)}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <LucideIcon name={setor.icon} className="h-7 w-7 text-primary" />
                    <div className="flex items-center gap-1">
                      {totalForms > 0 && (
                        <Badge variant="secondary" className="text-[10px] gap-1 bg-primary/10 text-primary border-primary/20">
                          <FileText className="h-2.5 w-2.5" /> {totalForms}
                        </Badge>
                      )}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => openEditSetorModal(setor, e)}><Edit className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => confirmDeleteSetor(setor.value, e)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{setor.label}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{segs.length} segmento{segs.length !== 1 ? 's' : ''}</p>
                    {setor.custom && <Badge variant="outline" className="text-[9px] mt-1 border-primary/30 text-primary">personalizado</Badge>}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  // ─── Render Segmentos ────────────────────────────────────────────

  const renderSegmentos = () => {
    if (!selectedSetor) return null;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={navigateBack} className="gap-1.5 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar
            </Button>
            <div className="flex items-center gap-2">
              <LucideIcon name={getSetorIcon(selectedSetor)} className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-lg font-bold text-foreground">{getSetorLabel(selectedSetor)}</h2>
                <p className="text-xs text-muted-foreground">Selecione um segmento para gerenciar formulários</p>
              </div>
            </div>
          </div>
          <Button size="sm" onClick={openNewSegmentoModal} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Novo Segmento
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {segmentos.map((seg) => {
            const segForms = getForms(selectedSetor, seg.value);
            const activeForm = segForms.find(f => f.active);

            return (
              <motion.div key={seg.value} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <Card
                  className={cn('cursor-pointer hover:shadow-md transition-all group border-0 shadow-none bg-card/50', activeForm && 'bg-primary/5')}
                  onClick={() => navigateToSegmento(seg.value)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', activeForm ? 'bg-primary/10' : 'bg-muted')}>
                      {activeForm ? <Layers className="h-5 w-5 text-primary" /> : <FolderOpen className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">{seg.label}</h3>
                        {seg.custom && <Badge variant="outline" className="text-[8px] px-1 py-0 border-primary/30 text-primary">custom</Badge>}
                        {segForms.length > 0 && (
                          <Badge variant="secondary" className="text-[10px] gap-1 shrink-0">
                            <FileText className="h-2.5 w-2.5" /> {segForms.length}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {activeForm ? `Ativo: ${activeForm.name}` : seg.description || 'Nenhum formulário ativo'}
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => openEditSegmentoModal(seg, e)}><Edit className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => confirmDeleteSegmento(seg.value, e)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {segmentos.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum segmento encontrado</p>
          </div>
        )}
      </div>
    );
  };

  // ─── Render Formulários ──────────────────────────────────────────

  const renderFormularios = () => {
    if (!selectedSetor || !selectedSegmento) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={navigateBack} className="gap-1.5 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar
            </Button>
            <div className="flex items-center gap-2">
              <LucideIcon name={getSetorIcon(selectedSetor)} className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {getSetorLabel(selectedSetor)} / {getSegmentoLabel(selectedSetor, selectedSegmento)}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Gerencie os formulários deste segmento — apenas 1 ativo por vez
                </p>
              </div>
            </div>
          </div>
          <Button size="sm" onClick={openNewFormModal} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Novo Formulário
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {forms.map((form) => {
            const blocks = getFormBlocks(selectedSetor, selectedSegmento, form.id);
            const fieldCount = blocks.filter(b => b.ativo !== false && b.category === 'field').length;

            return (
              <motion.div key={form.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <Card
                  className={cn(
                    'cursor-pointer hover:shadow-md transition-all group border-0 shadow-none bg-card/50',
                    form.active && 'bg-primary/5'
                  )}
                  onClick={() => navigateToEditor(form.id)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                      form.active ? 'bg-primary/15' : 'bg-muted'
                    )}>
                      {form.active
                        ? <Power className="h-5 w-5 text-primary" />
                        : <PowerOff className="h-5 w-5 text-muted-foreground" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                          {form.name}
                        </h3>
                        {form.active && (
                          <Badge className="text-[10px] gap-1 bg-primary text-primary-foreground">
                            <CheckCircle2 className="h-2.5 w-2.5" /> Ativo
                          </Badge>
                        )}
                        {!form.active && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">Inativo</Badge>
                        )}
                        {fieldCount > 0 && (
                          <Badge variant="secondary" className="text-[10px] gap-1 shrink-0">
                            <FileText className="h-2.5 w-2.5" /> {fieldCount} campo{fieldCount !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Criado em {new Date(form.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!form.active && (
                        <Button
                          variant="outline" size="sm"
                          className="h-7 text-[11px] gap-1 border-primary/30 text-primary hover:bg-primary/10"
                          onClick={(e) => handleToggleActive(form.id, e)}
                        >
                          <Power className="h-3 w-3" /> Ativar
                        </Button>
                      )}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => handleDuplicateForm(form, e)} title="Duplicar">
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => openEditFormModal(form, e)} title="Renomear">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => confirmDeleteForm(form.id, e)} title="Excluir">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {forms.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm mb-3">Nenhum formulário criado</p>
            <Button size="sm" onClick={openNewFormModal} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Criar Formulário
            </Button>
          </div>
        )}
      </div>
    );
  };

  // ─── Render Editor ───────────────────────────────────────────────

  const renderEditor = () => {
    if (!selectedSetor || !selectedSegmento || !selectedFormId) return null;
    const initialBlocks = getFormBlocks(selectedSetor, selectedSegmento, selectedFormId);
    const form = forms.find(f => f.id === selectedFormId);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={navigateBack} className="gap-1.5 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar
          </Button>
          <div className="flex items-center gap-2">
            <LucideIcon name={getSetorIcon(selectedSetor)} className="h-5 w-5 text-primary" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-foreground">
                  {form?.name || 'Formulário'}
                </h2>
                {form?.active && (
                  <Badge className="text-[9px] gap-1 bg-primary text-primary-foreground">
                    <CheckCircle2 className="h-2.5 w-2.5" /> Ativo
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                {getSetorLabel(selectedSetor)} / {getSegmentoLabel(selectedSetor, selectedSegmento)}
              </p>
            </div>
          </div>
        </div>

        <FormBuilderEditor
          key={`${selectedSetor}-${selectedSegmento}-${selectedFormId}-${version}`}
          setor={selectedSetor}
          segmento={selectedSegmento}
          setorLabel={getSetorLabel(selectedSetor)}
          segmentoLabel={getSegmentoLabel(selectedSetor, selectedSegmento)}
          initialBlocks={initialBlocks}
          onSave={handleSave}
        />
      </div>
    );
  };

  // ─── Main ────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <AdminBreadcrumb items={breadcrumbItems} />
      {viewLevel === 'setores' && renderSetores()}
      {viewLevel === 'segmentos' && renderSegmentos()}
      {viewLevel === 'formularios' && renderFormularios()}
      {viewLevel === 'editor' && renderEditor()}

      {/* ─── Setor Modal ───────────────────────────────────────── */}
      <Dialog open={setorModalOpen} onOpenChange={setSetorModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader><DialogTitle>{editingSetor ? 'Editar Setor' : 'Novo Setor'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome do Setor</Label>
              <Input value={setorForm.label} onChange={(e) => setSetorForm(f => ({ ...f, label: e.target.value }))} placeholder="Ex: Saúde, Educação..." />
            </div>
            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map(iconName => (
                  <button key={iconName} type="button" onClick={() => setSetorForm(f => ({ ...f, icon: iconName }))}
                    className={cn('w-9 h-9 rounded-lg flex items-center justify-center transition-all', setorForm.icon === iconName ? 'bg-primary/20 ring-2 ring-primary' : 'bg-muted/50 hover:bg-muted')}>
                    <LucideIcon name={iconName} className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSetorModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveSetor} className="gap-1.5"><Check className="h-3.5 w-3.5" />{editingSetor ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Segmento Modal ────────────────────────────────────── */}
      <Dialog open={segmentoModalOpen} onOpenChange={setSegmentoModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader><DialogTitle>{editingSegmento ? 'Editar Segmento' : 'Novo Segmento'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome do Segmento</Label>
              <Input value={segmentoForm.label} onChange={(e) => setSegmentoForm(f => ({ ...f, label: e.target.value }))} placeholder="Ex: Consultoria, Varejo..." />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={segmentoForm.description} onChange={(e) => setSegmentoForm(f => ({ ...f, description: e.target.value }))} placeholder="Breve descrição..." rows={3} className="resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSegmentoModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveSegmento} className="gap-1.5"><Check className="h-3.5 w-3.5" />{editingSegmento ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Form Modal ────────────────────────────────────────── */}
      <Dialog open={formModalOpen} onOpenChange={setFormModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader><DialogTitle>{editingForm ? 'Renomear Formulário' : 'Novo Formulário'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome do Formulário</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: Formulário v2, Completo..." />
            </div>
            {!editingForm && (
              <p className="text-xs text-muted-foreground">
                O formulário será criado com os campos padrão do setor. Você pode editá-los depois.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveForm} className="gap-1.5"><Check className="h-3.5 w-3.5" />{editingForm ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Setor Confirm ──────────────────────────────── */}
      <AlertDialog open={!!deleteSetorTarget} onOpenChange={() => setDeleteSetorTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir setor?</AlertDialogTitle>
            <AlertDialogDescription>Isso removerá o setor e todos os formulários associados.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSetor} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Delete Segmento Confirm ───────────────────────────── */}
      <AlertDialog open={!!deleteSegmentoTarget} onOpenChange={() => setDeleteSegmentoTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir segmento?</AlertDialogTitle>
            <AlertDialogDescription>Isso removerá o segmento e seus formulários.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSegmento} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Delete Form Confirm ───────────────────────────────── */}
      <AlertDialog open={!!deleteFormTarget} onOpenChange={() => setDeleteFormTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir formulário?</AlertDialogTitle>
            <AlertDialogDescription>Isso removerá o formulário e todos os seus campos. Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteForm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
