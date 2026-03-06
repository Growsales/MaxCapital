import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Loader2, Flame, Building2, TrendingUp, Target, MapPin } from 'lucide-react';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { Textarea } from '@/shared/components/textarea';
import { Badge } from '@/shared/components/badge';
import { Checkbox } from '@/shared/components/checkbox';
import { Skeleton } from '@/shared/components/skeleton';
import { Label } from '@/shared/components/label';
import { useTesesInvestimento } from '@/hooks/useTeses';
import { useAuth } from '@/shared/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const setoresOptions = [
  'Tecnologia', 'Agronegócio', 'Saúde', 'Energia', 'Financeiro',
  'Imobiliário', 'Indústria', 'Startups', 'Varejo', 'Educação', 'Logística',
];

const tiposTransacaoOptions = [
  'Venda total', 'Majoritária', 'Minoritária',
];

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } }
};

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
};

function SectionCard({ 
  icon: Icon, 
  title, 
  children, 
  className 
}: { 
  icon: React.ElementType; 
  title: string; 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <motion.div variants={fadeUp}>
      <div className={cn(
        "rounded-2xl bg-card p-6 space-y-5",
        className
      )}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Icon className="h-4.5 w-4.5 text-primary" />
          </div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
        </div>
        {children}
      </div>
    </motion.div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="text-sm font-medium text-foreground mb-1.5 block">
      {children}
    </Label>
  );
}

export default function ThesisEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: teses = [], isLoading } = useTesesInvestimento();
  const thesis = teses.find(t => t.id === id);

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valorMin, setValorMin] = useState('');
  const [valorMax, setValorMax] = useState('');
  const [faturamentoMin, setFaturamentoMin] = useState('');
  const [faturamentoMax, setFaturamentoMax] = useState('');
  const [ebitdaMin, setEbitdaMin] = useState('');
  const [ebitdaMax, setEbitdaMax] = useState('');
  const [modeloNegocio, setModeloNegocio] = useState('');
  const [faseInvestimento, setFaseInvestimento] = useState('');
  const [publicoAlvo, setPublicoAlvo] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [selectedSetores, setSelectedSetores] = useState<string[]>([]);
  const [selectedTipos, setSelectedTipos] = useState<string[]>([]);
  const [teseQuente, setTeseQuente] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (thesis) {
      setTitulo(thesis.titulo || '');
      setDescricao(thesis.descricao || '');
      setValorMin(thesis.valor_min?.toString() || '');
      setValorMax(thesis.valor_max?.toString() || '');
      setFaturamentoMin(thesis.faturamento_min?.toString() || '');
      setFaturamentoMax(thesis.faturamento_max?.toString() || '');
      setEbitdaMin(thesis.ebitda_min?.toString() || '');
      setEbitdaMax(thesis.ebitda_max?.toString() || '');
      setModeloNegocio(thesis.modelo_negocio || '');
      setFaseInvestimento(thesis.fase_investimento || '');
      setPublicoAlvo(thesis.publico_alvo || '');
      setLocalizacao(thesis.localizacao || '');
      setSelectedSetores(thesis.setores || []);
      setSelectedTipos(thesis.tipo_transacao || []);
      setTeseQuente(thesis.tese_quente || false);
    }
  }, [thesis]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-32" />
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!thesis || thesis.investidor_id !== user?.id) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <p className="text-lg text-muted-foreground">Tese não encontrada ou sem permissão</p>
        <Button onClick={() => navigate('/teses')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Minhas Teses
        </Button>
      </div>
    );
  }

  const toggleSetor = (setor: string) => {
    setSelectedSetores(prev =>
      prev.includes(setor) ? prev.filter(s => s !== setor) : [...prev, setor]
    );
  };

  const toggleTipo = (tipo: string) => {
    setSelectedTipos(prev =>
      prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    toast.success('Tese atualizada com sucesso!');
    setSaving(false);
    navigate('/teses');
  };

  return (
    <motion.div
      className="space-y-6 max-w-6xl mx-auto"
      initial="initial"
      animate="animate"
      variants={stagger}
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/teses/${id}`)} className="rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Editar Tese</h1>
            <p className="text-sm text-muted-foreground">Atualize os detalhes da sua tese de investimento</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 rounded-xl">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar
        </Button>
      </motion.div>

      {/* Grid */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Informações Básicas */}
        <SectionCard icon={Building2} title="Informações Básicas">
          <div className="space-y-4">
            <div>
              <FieldLabel>Título</FieldLabel>
              <Input value={titulo} onChange={e => setTitulo(e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <FieldLabel>Descrição</FieldLabel>
              <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={4} className="rounded-xl resize-none" />
            </div>
            <div>
              <FieldLabel>Localização</FieldLabel>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  value={localizacao} 
                  onChange={e => setLocalizacao(e.target.value)} 
                  placeholder="Ex: São Paulo, SP" 
                  className="rounded-xl pl-9" 
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Requisitos Financeiros */}
        <SectionCard icon={TrendingUp} title="Requisitos Financeiros">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Investimento Mín (R$)</FieldLabel>
                <Input type="number" value={valorMin} onChange={e => setValorMin(e.target.value)} className="rounded-xl" />
              </div>
              <div>
                <FieldLabel>Investimento Máx (R$)</FieldLabel>
                <Input type="number" value={valorMax} onChange={e => setValorMax(e.target.value)} className="rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Faturamento Mín (R$)</FieldLabel>
                <Input type="number" value={faturamentoMin} onChange={e => setFaturamentoMin(e.target.value)} className="rounded-xl" />
              </div>
              <div>
                <FieldLabel>Faturamento Máx (R$)</FieldLabel>
                <Input type="number" value={faturamentoMax} onChange={e => setFaturamentoMax(e.target.value)} className="rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>EBITDA Mín (R$)</FieldLabel>
                <Input type="number" value={ebitdaMin} onChange={e => setEbitdaMin(e.target.value)} className="rounded-xl" />
              </div>
              <div>
                <FieldLabel>EBITDA Máx (R$)</FieldLabel>
                <Input type="number" value={ebitdaMax} onChange={e => setEbitdaMax(e.target.value)} className="rounded-xl" />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Perfil da Empresa Alvo */}
        <SectionCard icon={Target} title="Perfil da Empresa Alvo">
          <div className="space-y-4">
            <div>
              <FieldLabel>Modelo de Negócio</FieldLabel>
              <Input value={modeloNegocio} onChange={e => setModeloNegocio(e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <FieldLabel>Fase de Investimento</FieldLabel>
              <Input value={faseInvestimento} onChange={e => setFaseInvestimento(e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <FieldLabel>Público Alvo</FieldLabel>
              <Input value={publicoAlvo} onChange={e => setPublicoAlvo(e.target.value)} className="rounded-xl" />
            </div>
          </div>
        </SectionCard>

        {/* Setores & Tipos */}
        <SectionCard icon={Target} title="Setores & Tipos de Operação">
          <div className="space-y-5">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
                Setores de Interesse
              </span>
              <div className="flex flex-wrap gap-2">
                {setoresOptions.map(setor => (
                  <Badge
                    key={setor}
                    variant={selectedSetores.includes(setor) ? 'default' : 'outline'}
                    className={cn(
                      "cursor-pointer transition-all rounded-full px-3 py-1 text-xs font-medium",
                      selectedSetores.includes(setor) 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "hover:bg-muted"
                    )}
                    onClick={() => toggleSetor(setor)}
                  >
                    {setor}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
                Tipo de Transação
              </span>
              <div className="flex flex-wrap gap-2">
                {tiposTransacaoOptions.map(tipo => (
                  <Badge
                    key={tipo}
                    variant={selectedTipos.includes(tipo) ? 'default' : 'outline'}
                    className={cn(
                      "cursor-pointer transition-all rounded-full px-3 py-1 text-xs font-medium",
                      selectedTipos.includes(tipo) 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "hover:bg-muted"
                    )}
                    onClick={() => toggleTipo(tipo)}
                  >
                    {tipo}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Bottom Save */}
      <motion.div variants={fadeUp} className="flex justify-end pb-8">
        <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2 rounded-xl px-8">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar alterações
        </Button>
      </motion.div>
    </motion.div>
  );
}
