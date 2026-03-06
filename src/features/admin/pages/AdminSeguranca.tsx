import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Lock,
  Plus,
  FileText,
  Edit3,
  Trash2,
  Eye,
  Save,
  X,
  CheckCircle2,
  AlertTriangle,
  HandHeart,
  Building2,
  UserCheck,
  ChevronDown,
  Copy,
  ToggleLeft,
  ToggleRight,
  Download,
  Upload,
  History,
  Clock,
} from 'lucide-react';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { AdminBreadcrumb } from '@/features/admin/components/AdminBreadcrumb';
import { Card, CardContent } from '@/shared/components/card';
import { Button } from '@/shared/components/button';
import { Badge } from '@/shared/components/badge';
import { Input } from '@/shared/components/input';
import { Textarea } from '@/shared/components/textarea';
import { Separator } from '@/shared/components/separator';
import { ScrollArea } from '@/shared/components/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────

interface SecurityFormClause {
  id: string;
  title: string;
  content: string;
}

interface SecurityFormVersion {
  version: number;
  savedAt: string;
  clauses: SecurityFormClause[];
  footerNote: string;
  checkboxLabel: string;
  description: string;
}

interface SecurityForm {
  id: string;
  name: string;
  slug: string;
  category: 'lgpd' | 'interesse' | 'confidencialidade' | 'empresa' | 'outro';
  description: string;
  clauses: SecurityFormClause[];
  footerNote: string;
  checkboxLabel: string;
  active: boolean;
  updatedAt: string;
  createdAt: string;
  version: number;
  history: SecurityFormVersion[];
}

type EditorMode = 'create' | 'edit';

// ── Constants ──────────────────────────────────────────────────────────

const categoryConfig: Record<SecurityForm['category'], { label: string; icon: typeof Shield; color: string; bg: string }> = {
  lgpd: { label: 'LGPD', icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  interesse: { label: 'Manifestação de Interesse', icon: HandHeart, color: 'text-primary', bg: 'bg-primary/10' },
  confidencialidade: { label: 'Confidencialidade', icon: Lock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  empresa: { label: 'Empresa / PJ', icon: Building2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  outro: { label: 'Outro', icon: FileText, color: 'text-violet-500', bg: 'bg-violet-500/10' },
};

const STORAGE_KEY = 'admin-security-forms';

const defaultForms: SecurityForm[] = [
  {
    id: '1',
    name: 'Termo LGPD - Operação Parceiro',
    slug: 'lgpd-operacao-parceiro',
    category: 'lgpd',
    description: 'Termo de confidencialidade e proteção de dados para operações de parceiros.',
    clauses: [
      { id: 'c1', title: 'CLÁUSULA 1 - DO OBJETO', content: '1.1. O presente Termo tem por objeto regular a confidencialidade das informações trocadas entre as partes no âmbito de possíveis negociações e/ou parcerias comerciais.\n\n1.2. São consideradas informações confidenciais todas as informações técnicas, comerciais, financeiras, estratégicas, dados pessoais e quaisquer outras informações reveladas por qualquer das partes.' },
      { id: 'c2', title: 'CLÁUSULA 2 - DA ASSINATURA ELETRÔNICA', content: '2.1. As partes reconhecem a validade jurídica da assinatura eletrônica realizada por meio desta plataforma, em conformidade com a Medida Provisória 2.200-2/2001.\n\n2.2. A aceitação eletrônica deste termo produz os mesmos efeitos jurídicos de uma assinatura manuscrita.' },
      { id: 'c3', title: 'CLÁUSULA 3 - DO PRAZO', content: '3.1. As obrigações de confidencialidade permanecerão em vigor pelo prazo de 2 (dois) anos após a conclusão ou descarte do projeto.' },
      { id: 'c4', title: 'CLÁUSULA 4 - DAS SANÇÕES', content: '4.1. O descumprimento sujeitará a parte infratora às sanções judiciais cabíveis, incluindo indenização por perdas e danos e multa contratual no valor de R$ 50.000,00.' },
      { id: 'c5', title: 'CLÁUSULA 5 - DO FORO', content: '5.1. Fica eleito o Foro da Comarca de São Paulo/SP para dirimir quaisquer controvérsias.' },
    ],
    footerNote: 'Ao marcar a caixa abaixo, você declara ter lido, compreendido e concordado com todos os termos e condições estabelecidos neste documento.',
    checkboxLabel: 'Li e aceito os termos de confidencialidade e proteção de dados acima descritos. Declaro estar ciente das obrigações e responsabilidades assumidas.',
    active: true,
    version: 1,
    history: [],
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Termo LGPD - Empresa',
    slug: 'lgpd-empresa',
    category: 'empresa',
    description: 'Termo de confidencialidade e proteção de dados para empresas (PJ).',
    clauses: [
      { id: 'c1', title: 'CLÁUSULA 1 - DO OBJETO', content: '1.1. O presente Termo tem por objeto regular a confidencialidade das informações trocadas entre as partes, incluindo informações financeiras, operacionais e estratégicas da empresa.' },
      { id: 'c2', title: 'CLÁUSULA 2 - TRATAMENTO DE DADOS (LGPD)', content: '2.1. Em conformidade com a Lei nº 13.709/2018 (LGPD), as partes se comprometem a tratar os dados pessoais compartilhados exclusivamente para as finalidades descritas neste termo.\n\n2.2. Os dados coletados serão utilizados para análise de viabilidade de operações financeiras, comunicação e cumprimento de obrigações legais.' },
      { id: 'c3', title: 'CLÁUSULA 3 - DA ASSINATURA ELETRÔNICA', content: '3.1. As partes reconhecem a validade jurídica da assinatura eletrônica em conformidade com a MP 2.200-2/2001.' },
    ],
    footerNote: 'Ao marcar a caixa abaixo, você declara ter lido e concordado com todos os termos em nome da empresa que representa.',
    checkboxLabel: 'Li e aceito os termos de confidencialidade e proteção de dados. Declaro estar ciente das obrigações assumidas em nome da empresa que represento.',
    active: true,
    version: 1,
    history: [],
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Termos de Manifestação de Interesse',
    slug: 'manifestacao-interesse',
    category: 'interesse',
    description: 'Termos exibidos ao investidor antes de manifestar interesse em uma oportunidade.',
    clauses: [
      { id: 'c1', title: '1. Análise de Perfil', content: 'Nossa equipe especializada entrará em contato em até 48 horas úteis para avaliar a compatibilidade desta oportunidade com o seu perfil de investidor e seus objetivos financeiros.' },
      { id: 'c2', title: '2. Acesso à Documentação', content: 'Após a análise inicial, você terá acesso integral aos documentos da oferta, incluindo prospecto, relatórios financeiros e termo de adesão, para sua análise detalhada antes de qualquer compromisso.' },
      { id: 'c3', title: '3. Sem Compromisso', content: 'A manifestação de interesse não constitui compromisso de investimento, reserva de valores ou obrigação de aporte. Você poderá desistir a qualquer momento sem ônus.' },
      { id: 'c4', title: '4. Confidencialidade', content: 'Todas as informações compartilhadas durante o processo são tratadas com sigilo e em conformidade com a LGPD (Lei Geral de Proteção de Dados).' },
      { id: 'c5', title: '5. Riscos', content: 'Todo investimento envolve riscos. Recomendamos a leitura completa dos documentos e, se necessário, a consulta a um assessor financeiro independente antes de tomar qualquer decisão.' },
    ],
    footerNote: '',
    checkboxLabel: 'Li e aceito os termos de manifestação de interesse. Entendo que a equipe entrará em contato para dar continuidade ao processo.',
    active: true,
    version: 1,
    history: [],
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];

// ── Helpers ────────────────────────────────────────────────────────────

function loadForms(): SecurityForm[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return defaultForms;
}

function saveForms(forms: SecurityForm[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(forms));
}

const genId = () => Math.random().toString(36).slice(2, 10);

// ── Component ──────────────────────────────────────────────────────────

export default function AdminSeguranca() {
  const { isMaster } = useAdminPermissions();
  const [forms, setForms] = useState<SecurityForm[]>(loadForms);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('create');
  const [editingForm, setEditingForm] = useState<SecurityForm | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewForm, setPreviewForm] = useState<SecurityForm | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyForm, setHistoryForm] = useState<SecurityForm | null>(null);

  useEffect(() => {
    saveForms(forms);
    window.dispatchEvent(new Event('security-forms-updated'));
  }, [forms]);

  if (!isMaster) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground">Apenas administradores Master podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  // ── Handlers ─────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingForm({
      id: genId(),
      name: '',
      slug: '',
      category: 'lgpd',
      description: '',
      clauses: [{ id: genId(), title: '', content: '' }],
      footerNote: '',
      checkboxLabel: '',
      active: true,
      version: 1,
      history: [],
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
    setEditorMode('create');
    setEditorOpen(true);
  };

  const openEdit = (form: SecurityForm) => {
    setEditingForm({ ...form, clauses: form.clauses.map(c => ({ ...c })) });
    setEditorMode('edit');
    setEditorOpen(true);
  };

  const saveForm = () => {
    if (!editingForm || !editingForm.name.trim()) {
      toast.error('Nome do formulário é obrigatório');
      return;
    }
    const now = new Date().toISOString();
    const slug = editingForm.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    if (editorMode === 'create') {
      setForms(prev => [...prev, { ...editingForm, updatedAt: now, slug }]);
      toast.success('Formulário criado com sucesso');
    } else {
      // Snapshot current version into history before overwriting
      setForms(prev => prev.map(f => {
        if (f.id !== editingForm.id) return f;
        const snapshot: SecurityFormVersion = {
          version: f.version,
          savedAt: f.updatedAt,
          clauses: f.clauses.map(c => ({ ...c })),
          footerNote: f.footerNote,
          checkboxLabel: f.checkboxLabel,
          description: f.description,
        };
        return {
          ...editingForm,
          slug,
          updatedAt: now,
          version: f.version + 1,
          history: [...f.history, snapshot],
        };
      }));
      toast.success(`Formulário atualizado → v${(forms.find(f => f.id === editingForm.id)?.version ?? 0) + 1}`);
    }
    setEditorOpen(false);
    setEditingForm(null);
  };

  const deleteForm = (id: string) => {
    setForms(prev => prev.filter(f => f.id !== id));
    setDeleteConfirm(null);
    toast.success('Formulário excluído');
  };

  const toggleActive = (id: string) => {
    setForms(prev => prev.map(f => f.id === id ? { ...f, active: !f.active, updatedAt: new Date().toISOString() } : f));
  };

  const duplicateForm = (form: SecurityForm) => {
    const dup: SecurityForm = {
      ...form,
      id: genId(),
      name: `${form.name} (Cópia)`,
      slug: `${form.slug}-copia`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setForms(prev => [...prev, dup]);
    toast.success('Formulário duplicado');
  };

  // ── Clause helpers ───────────────────────────────────────────────────

  const addClause = () => {
    if (!editingForm) return;
    setEditingForm({
      ...editingForm,
      clauses: [...editingForm.clauses, { id: genId(), title: '', content: '' }],
    });
  };

  const updateClause = (clauseId: string, field: 'title' | 'content', value: string) => {
    if (!editingForm) return;
    setEditingForm({
      ...editingForm,
      clauses: editingForm.clauses.map(c => c.id === clauseId ? { ...c, [field]: value } : c),
    });
  };

  const removeClause = (clauseId: string) => {
    if (!editingForm) return;
    setEditingForm({
      ...editingForm,
      clauses: editingForm.clauses.filter(c => c.id !== clauseId),
    });
  };

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <AdminBreadcrumb items={[{ label: 'Segurança' }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Segurança & Termos Legais</h1>
          <p className="text-muted-foreground">Gerencie os formulários de LGPD, manifestação de interesse e confidencialidade.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
            const blob = new Blob([JSON.stringify(forms, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `security-forms-${new Date().toISOString().slice(0, 10)}.json`; a.click();
            URL.revokeObjectURL(url);
            toast.success('Formulários exportados');
          }}>
            <Download className="h-4 w-4" />
            Exportar JSON
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
            const input = document.createElement('input');
            input.type = 'file'; input.accept = '.json';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                try {
                  const imported = JSON.parse(ev.target?.result as string);
                  if (!Array.isArray(imported)) throw new Error('invalid');
                  setForms(prev => [...prev, ...imported.map((f: any) => ({ ...f, id: Math.random().toString(36).slice(2, 10) }))]);
                  toast.success(`${imported.length} formulário(s) importado(s)`);
                } catch { toast.error('Arquivo JSON inválido'); }
              };
              reader.readAsText(file);
            };
            input.click();
          }}>
            <Upload className="h-4 w-4" />
            Importar JSON
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Formulário
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: forms.length, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Ativos', value: forms.filter(f => f.active).length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Inativos', value: forms.filter(f => !f.active).length, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Categorias', value: new Set(forms.map(f => f.category)).size, icon: Shield, color: 'text-violet-500', bg: 'bg-violet-500/10' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border-border/40">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn('p-2 rounded-xl', stat.bg)}><stat.icon className={cn('h-5 w-5', stat.color)} /></div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Forms list */}
      <div className="space-y-3">
        {forms.map((form, i) => {
          const cat = categoryConfig[form.category];
          const CatIcon = cat.icon;
          return (
            <motion.div
              key={form.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="border-border/40 hover:border-border/80 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={cn('p-2.5 rounded-xl flex-shrink-0', cat.bg)}>
                    <CatIcon className={cn('h-5 w-5', cat.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">{form.name}</h3>
                      <Badge variant="secondary" className={cn('text-[10px] border-0', form.active ? 'bg-emerald-500/15 text-emerald-500' : 'bg-muted text-muted-foreground')}>
                        {form.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] border-border/50 text-muted-foreground">
                        v{form.version ?? 1}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{form.description || 'Sem descrição'}</p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                      <span>{cat.label}</span>
                      <span>·</span>
                      <span>{form.clauses.length} cláusula{form.clauses.length !== 1 ? 's' : ''}</span>
                      <span>·</span>
                      <span>{(form.history?.length ?? 0)} revisão(ões)</span>
                      <span>·</span>
                      <span>Atualizado {new Date(form.updatedAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setPreviewForm(form); setPreviewOpen(true); }} title="Visualizar">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(form)} title="Editar">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicateForm(form)} title="Duplicar">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setHistoryForm(form); setHistoryOpen(true); }} title="Histórico" disabled={!form.history?.length}>
                      <History className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(form.id)} title={form.active ? 'Desativar' : 'Ativar'}>
                      {form.active ? <ToggleRight className="h-4 w-4 text-emerald-500" /> : <ToggleLeft className="h-4 w-4" />}
                    </Button>
                    {deleteConfirm === form.id ? (
                      <div className="flex items-center gap-1">
                        <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={() => deleteForm(form.id)}>Confirmar</Button>
                        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(form.id)} title="Excluir">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {forms.length === 0 && (
          <div className="flex items-center justify-center min-h-[30vh] border border-dashed rounded-lg">
            <div className="text-center text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4" />
              <p>Nenhum formulário de segurança cadastrado.</p>
              <Button variant="outline" className="mt-4 gap-2" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Criar Primeiro Formulário
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Editor Modal ─────────────────────────────────────────────── */}
      <Dialog open={editorOpen} onOpenChange={(o) => { if (!o) { setEditorOpen(false); setEditingForm(null); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 overflow-hidden border-border/50">
          <div className="h-1.5 bg-gradient-to-r from-primary via-primary/70 to-primary/30" />
          <DialogHeader className="px-6 pt-4 pb-2">
            <DialogTitle>{editorMode === 'create' ? 'Novo Formulário de Segurança' : 'Editar Formulário'}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] px-6 pb-6">
            {editingForm && (
              <div className="space-y-5">
                {/* Basic info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-foreground mb-1 block">Nome do Formulário *</label>
                    <Input value={editingForm.name} onChange={(e) => setEditingForm({ ...editingForm, name: e.target.value })} placeholder="Ex: Termo LGPD - Parceiro" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Categoria</label>
                    <Select value={editingForm.category} onValueChange={(v) => setEditingForm({ ...editingForm, category: v as SecurityForm['category'] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryConfig).map(([key, cfg]) => (
                          <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={editingForm.active} onChange={(e) => setEditingForm({ ...editingForm, active: e.target.checked })} className="rounded" />
                      Ativo
                    </label>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-foreground mb-1 block">Descrição</label>
                    <Input value={editingForm.description} onChange={(e) => setEditingForm({ ...editingForm, description: e.target.value })} placeholder="Breve descrição do termo" />
                  </div>
                </div>

                <Separator />

                {/* Clauses */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-foreground text-sm">Cláusulas</h3>
                    <Button variant="outline" size="sm" onClick={addClause} className="gap-1.5 h-8 text-xs">
                      <Plus className="h-3.5 w-3.5" />
                      Adicionar Cláusula
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {editingForm.clauses.map((clause, ci) => (
                      <Card key={clause.id} className="border-border/40">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Cláusula {ci + 1}</span>
                            {editingForm.clauses.length > 1 && (
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeClause(clause.id)}>
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                          <Input
                            value={clause.title}
                            onChange={(e) => updateClause(clause.id, 'title', e.target.value)}
                            placeholder="Título da cláusula"
                            className="text-sm font-medium"
                          />
                          <Textarea
                            value={clause.content}
                            onChange={(e) => updateClause(clause.id, 'content', e.target.value)}
                            placeholder="Conteúdo da cláusula..."
                            rows={4}
                            className="text-sm"
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Footer & Checkbox */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Nota de Rodapé</label>
                    <Textarea
                      value={editingForm.footerNote}
                      onChange={(e) => setEditingForm({ ...editingForm, footerNote: e.target.value })}
                      placeholder="Texto exibido antes do checkbox de aceite..."
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Texto do Checkbox de Aceite</label>
                    <Textarea
                      value={editingForm.checkboxLabel}
                      onChange={(e) => setEditingForm({ ...editingForm, checkboxLabel: e.target.value })}
                      placeholder="Li e aceito os termos..."
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2 pb-4">
                  <Button variant="outline" onClick={() => { setEditorOpen(false); setEditingForm(null); }} className="flex-1">Cancelar</Button>
                  <Button onClick={saveForm} className="flex-1 gap-2">
                    <Save className="h-4 w-4" />
                    {editorMode === 'create' ? 'Criar Formulário' : 'Salvar Alterações'}
                  </Button>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* ── Preview Modal ────────────────────────────────────────────── */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] p-0 overflow-hidden border-border/50">
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300" />
          <DialogHeader className="px-6 pt-4 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              Pré-visualização
            </DialogTitle>
          </DialogHeader>
          {previewForm && (
            <ScrollArea className="max-h-[65vh] px-6 pb-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <Shield className="h-8 w-8 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground">{previewForm.name}</h3>
                    <p className="text-sm text-muted-foreground">{previewForm.description}</p>
                  </div>
                </div>

                {/* Clauses */}
                <div className="rounded-lg border border-border p-4 bg-muted/30 space-y-4 text-sm text-muted-foreground">
                  {previewForm.clauses.map((clause) => (
                    <div key={clause.id}>
                      <p className="font-medium text-foreground">{clause.title}</p>
                      <p className="whitespace-pre-line mt-1">{clause.content}</p>
                    </div>
                  ))}
                  {previewForm.footerNote && (
                    <p className="mt-4 text-xs text-muted-foreground">{previewForm.footerNote}</p>
                  )}
                </div>

                {/* Checkbox preview */}
                <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card">
                  <div className="h-4 w-4 rounded border border-primary/50 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{previewForm.checkboxLabel}</p>
                </div>

                <p className="text-[11px] text-center text-muted-foreground">
                  Esta é uma pré-visualização. O layout final pode variar conforme o contexto de uso.
                </p>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* ── History Modal ────────────────────────────────────────────── */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] p-0 overflow-hidden border-border/50">
          <div className="h-1.5 bg-gradient-to-r from-violet-500 via-violet-400 to-violet-300" />
          <DialogHeader className="px-6 pt-4 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              Histórico de Versões
            </DialogTitle>
          </DialogHeader>
          {historyForm && (
            <ScrollArea className="max-h-[65vh] px-6 pb-6">
              <div className="space-y-3">
                {/* Current version */}
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-primary/15 text-primary border-0 text-xs">v{historyForm.version} (atual)</Badge>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(historyForm.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{historyForm.clauses.length} cláusulas</p>
                  </CardContent>
                </Card>

                {/* Past versions */}
                {[...(historyForm.history ?? [])].reverse().map((ver, i) => (
                  <motion.div key={ver.version} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <Card className="border-border/40">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs border-border/50">v{ver.version}</Badge>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(ver.savedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{ver.clauses.length} cláusulas</p>
                        <details className="text-xs">
                          <summary className="cursor-pointer text-primary hover:text-primary/80 font-medium">Ver conteúdo desta versão</summary>
                          <div className="mt-2 space-y-2 text-muted-foreground border-t border-border/30 pt-2">
                            {ver.clauses.map(c => (
                              <div key={c.id}>
                                <p className="font-medium text-foreground">{c.title}</p>
                                <p className="whitespace-pre-line text-[11px]">{c.content}</p>
                              </div>
                            ))}
                            {ver.checkboxLabel && (
                              <p className="italic text-[11px] mt-2 border-t border-border/20 pt-2">Checkbox: {ver.checkboxLabel}</p>
                            )}
                          </div>
                        </details>
                        <div className="flex justify-end mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => {
                              const restored: SecurityForm = {
                                ...historyForm,
                                clauses: ver.clauses.map(c => ({ ...c })),
                                footerNote: ver.footerNote,
                                checkboxLabel: ver.checkboxLabel,
                                description: ver.description,
                              };
                              setEditingForm(restored);
                              setEditorMode('edit');
                              setHistoryOpen(false);
                              setEditorOpen(true);
                              toast.info(`Versão ${ver.version} carregada no editor. Salve para aplicar.`);
                            }}
                          >
                            Restaurar no editor
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {(!historyForm.history || historyForm.history.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma versão anterior registrada.</p>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
