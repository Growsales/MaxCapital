import { motion } from 'framer-motion';
import { 
  Settings, Save, Bell, Shield, DollarSign, Clock, 
  Mail, Database, Loader2, Globe, Wrench, AlertTriangle, TrendingUp,
  Percent, BanknoteIcon, MessageSquare, Lock, Eye, UserCheck,
  Plug, Webhook, Key, ExternalLink, CheckCircle2, XCircle, Plus,
  Image as ImageIcon, Trash2, Link as LinkIcon, Upload, Cpu, Zap,
  HardDrive, MessageCircle, CreditCard, FileSpreadsheet, Mic, Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/card';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { Label } from '@/shared/components/label';
import { Switch } from '@/shared/components/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/tabs';
import { Textarea } from '@/shared/components/textarea';
import { Badge } from '@/shared/components/badge';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { toast } from 'sonner';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { AdminBreadcrumb } from '@/features/admin/components/AdminBreadcrumb';
import { notifyConfigChange } from '@/hooks/useConfigImages';
import { useAdminLogs } from '@/hooks/useAdminLogs';

const STORAGE_KEY = 'admin-configuracoes-cache';

// Reusable config field
function ConfigField({ label, description, children, icon: Icon }: { 
  label: string; description?: string; children: React.ReactNode; icon?: React.ElementType 
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-sm">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        {label}
      </Label>
      {children}
      {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
    </div>
  );
}

// Reusable toggle row
function ToggleRow({ label, description, checked, onChange }: { 
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void 
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/10 last:border-0">
      <div className="space-y-0.5">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

// Section card wrapper
function ConfigSection({ title, description, icon: Icon, children, badge }: { 
  title: string; description: string; icon: React.ElementType; children: React.ReactNode; badge?: string 
}) {
  return (
    <Card className="border-border/30">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted/50">
            <Icon className="h-4 w-4 text-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold">{title}</CardTitle>
              {badge && <Badge variant="outline" className="text-[10px] font-normal">{badge}</Badge>}
            </div>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

// Reusable image config field with URL + Upload
function ImageConfigField({ configKey, label, description, value, onChange, onClear }: {
  configKey: string; label: string; description: string; value: string;
  onChange: (key: string, value: string) => void; onClear: () => void;
}) {
  const [mode, setMode] = useState<'url' | 'upload'>('url');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Máximo 5MB.'); return; }
    const reader = new FileReader();
    reader.onloadend = () => onChange(configKey, reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-start gap-4 py-4 border-b border-border/10 last:border-0">
      <div className="flex-1 space-y-2">
        <Label className="flex items-center gap-1.5 text-sm">
          <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
          {label}
        </Label>
        <div className="flex gap-1.5 mb-2">
          <Button type="button" size="sm" variant={mode === 'url' ? 'default' : 'outline'} onClick={() => setMode('url')} className="gap-1 h-7 text-xs px-2">
            <LinkIcon className="h-3 w-3" />URL
          </Button>
          <Button type="button" size="sm" variant={mode === 'upload' ? 'default' : 'outline'} onClick={() => setMode('upload')} className="gap-1 h-7 text-xs px-2">
            <Upload className="h-3 w-3" />Upload
          </Button>
        </div>
        {mode === 'url' ? (
          <Input value={value} onChange={(e) => onChange(configKey, e.target.value)} placeholder="https://exemplo.com/imagem.jpg" />
        ) : (
          <>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <Button type="button" variant="outline" className="w-full h-14 border-dashed border-2 gap-2 text-xs text-muted-foreground hover:text-foreground" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" />Clique para selecionar
            </Button>
            <p className="text-[10px] text-muted-foreground">PNG, JPG ou WEBP. Máx 5MB.</p>
          </>
        )}
        {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
      </div>
      {value && (
        <div className="relative flex-shrink-0 mt-6">
          <img src={value} alt={label} className="h-16 w-28 rounded-lg object-cover border border-border/30" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <Button type="button" size="sm" variant="destructive" className="absolute -top-1.5 -right-1.5 h-5 w-5 p-0 rounded-full" onClick={onClear}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function AdminConfiguracoes() {
  const { isMaster } = useAdminPermissions();
  const { logAction } = useAdminLogs();
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try { setConfigs(JSON.parse(cached)); } catch { /* ignore */ }
    }
    setIsLoading(false);
  }, []);

  const handleChange = (key: string, value: string) => {
    setConfigs(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const saveAllConfigs = () => {
    setIsSaving(true);
    const previousConfigs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
    notifyConfigChange();
    // Find changed keys
    const changedKeys = Object.keys(configs).filter(k => configs[k] !== previousConfigs[k]);
    logAction({
      acao: 'editar',
      recurso: 'configuracoes',
      descricao: `Configurações atualizadas: ${changedKeys.length} campo(s) alterado(s)`,
      dados_anteriores: Object.fromEntries(changedKeys.map(k => [k, previousConfigs[k] || ''])),
      dados_novos: Object.fromEntries(changedKeys.map(k => [k, configs[k]])),
    });
    setTimeout(() => {
      toast.success('Configurações salvas!');
      setHasChanges(false);
      setIsSaving(false);
    }, 300);
  };

  if (!isMaster) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="max-w-md border-border/30">
          <CardContent className="pt-6 text-center">
            <Settings className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="text-lg font-semibold mb-1">Acesso Restrito</h2>
            <p className="text-sm text-muted-foreground">Apenas usuários Master podem acessar as configurações.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <AdminBreadcrumb items={[{ label: 'Configurações' }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">Gerencie as configurações globais da plataforma</p>
        </div>
        {hasChanges && (
          <Button onClick={saveAllConfigs} disabled={isSaving} size="sm" className="gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </Button>
        )}
      </div>

      <Tabs defaultValue="operacoes">
        <TabsList className="flex-wrap">
          <TabsTrigger value="operacoes" className="gap-1.5 text-xs"><Clock className="h-3.5 w-3.5" />Operações</TabsTrigger>
          <TabsTrigger value="comissoes" className="gap-1.5 text-xs"><DollarSign className="h-3.5 w-3.5" />Comissões</TabsTrigger>
          <TabsTrigger value="notificacoes" className="gap-1.5 text-xs"><Bell className="h-3.5 w-3.5" />Notificações</TabsTrigger>
          <TabsTrigger value="seguranca" className="gap-1.5 text-xs"><Shield className="h-3.5 w-3.5" />Segurança</TabsTrigger>
          <TabsTrigger value="sistema" className="gap-1.5 text-xs"><Globe className="h-3.5 w-3.5" />Plataforma</TabsTrigger>
          <TabsTrigger value="imagens" className="gap-1.5 text-xs"><ImageIcon className="h-3.5 w-3.5" />Imagens</TabsTrigger>
          <TabsTrigger value="integracoes" className="gap-1.5 text-xs"><Plug className="h-3.5 w-3.5" />Integrações</TabsTrigger>
        </TabsList>

        {/* OPERAÇÕES */}
        <TabsContent value="operacoes" className="space-y-4 mt-6">
          <ConfigSection title="Prazos e Alertas" description="Configure quando operações devem gerar alertas" icon={AlertTriangle}>
            <div className="grid grid-cols-3 gap-4">
              <ConfigField label="Alerta (dias)" description="Operação sem movimentação" icon={Clock}>
                <Input type="number" value={configs.dias_alerta_operacao || ''} onChange={(e) => handleChange('dias_alerta_operacao', e.target.value)} placeholder="14" />
              </ConfigField>
              <ConfigField label="Crítico (dias)" description="Operação parada demais" icon={AlertTriangle}>
                <Input type="number" value={configs.dias_critico_operacao || ''} onChange={(e) => handleChange('dias_critico_operacao', e.target.value)} placeholder="30" />
              </ConfigField>
              <ConfigField label="Prazo máximo (dias)" description="Limite para conclusão" icon={Clock}>
                <Input type="number" value={configs.prazo_maximo_operacao || ''} onChange={(e) => handleChange('prazo_maximo_operacao', e.target.value)} placeholder="180" />
              </ConfigField>
            </div>
          </ConfigSection>

          <ConfigSection title="Validações de Valor" description="Limites de valor para novas operações" icon={Shield}>
            <div className="grid grid-cols-2 gap-4">
              <ConfigField label="Valor Mínimo (R$)" icon={BanknoteIcon} description="Operações abaixo deste valor são rejeitadas">
                <Input type="number" value={configs.valor_minimo_operacao || ''} onChange={(e) => handleChange('valor_minimo_operacao', e.target.value)} placeholder="50.000" />
              </ConfigField>
              <ConfigField label="Valor Máximo (R$)" icon={BanknoteIcon} description="Operações acima requerem aprovação especial">
                <Input type="number" value={configs.valor_maximo_operacao || ''} onChange={(e) => handleChange('valor_maximo_operacao', e.target.value)} placeholder="50.000.000" />
              </ConfigField>
            </div>
            <ToggleRow label="Exigir CNPJ válido" description="Valida o CNPJ da empresa antes de criar a operação" checked={configs.exigir_cnpj_valido === 'true'} onChange={(v) => handleChange('exigir_cnpj_valido', String(v))} />
          </ConfigSection>

          <ConfigSection title="Mensagem de Sucesso" description="Exibida após cadastrar uma operação" icon={MessageSquare} badge="Dinâmico">
            <ConfigField label="Nº de Fundos Disponíveis">
              <Input type="number" value={configs.fundos_disponiveis_quantidade || ''} onChange={(e) => handleChange('fundos_disponiveis_quantidade', e.target.value)} placeholder="15" />
            </ConfigField>
            <ConfigField label="Template da Mensagem" description="Use {quantidade} para inserir o número dinamicamente">
              <Textarea value={configs.fundos_disponiveis_mensagem || ''} onChange={(e) => handleChange('fundos_disponiveis_mensagem', e.target.value)} placeholder="Sua operação foi cadastrada com sucesso! Identificamos {quantidade} fundos..." rows={2} />
            </ConfigField>
          </ConfigSection>


        </TabsContent>

        {/* COMISSÕES */}
        <TabsContent value="comissoes" className="space-y-4 mt-6">
          <ConfigSection title="Percentuais de Comissão" description="Defina os percentuais para parceiros e indicações" icon={Percent}>
            <div className="grid grid-cols-2 gap-4">
              <ConfigField label="Comissão Direta (%)" description="Parceiro originador" icon={Percent}>
                <Input type="number" step="0.1" value={configs.comissao_direta_percentual || ''} onChange={(e) => handleChange('comissao_direta_percentual', e.target.value)} placeholder="2.0" />
              </ConfigField>
              <ConfigField label="Comissão Indireta (%)" description="Indicações indiretas" icon={Percent}>
                <Input type="number" step="0.1" value={configs.comissao_indireta_percentual || ''} onChange={(e) => handleChange('comissao_indireta_percentual', e.target.value)} placeholder="0.5" />
              </ConfigField>
              <ConfigField label="Indicação Nível 1 (%)" icon={Percent}>
                <Input type="number" step="0.1" value={configs.comissao_indicacao_nivel1 || ''} onChange={(e) => handleChange('comissao_indicacao_nivel1', e.target.value)} placeholder="1.0" />
              </ConfigField>
              <ConfigField label="Indicação Nível 2 (%)" icon={Percent}>
                <Input type="number" step="0.1" value={configs.comissao_indicacao_nivel2 || ''} onChange={(e) => handleChange('comissao_indicacao_nivel2', e.target.value)} placeholder="0.25" />
              </ConfigField>
            </div>
            <ConfigField label="Potenciais Ganhos (%)" description="Percentual usado para estimar ganhos futuros na aba Visão Geral da Rede" icon={Percent}>
              <Input type="number" step="0.1" value={configs.comissao_potenciais_ganhos || ''} onChange={(e) => handleChange('comissao_potenciais_ganhos', e.target.value)} placeholder="15" />
            </ConfigField>
          </ConfigSection>

          <ConfigSection title="Pagamento" description="Regras para pagamento de comissões" icon={BanknoteIcon}>
            <ConfigField label="Valor Mínimo para Pagamento (R$)" description="Abaixo disso, a comissão acumula" icon={BanknoteIcon}>
              <Input type="number" value={configs.valor_minimo_pagamento || ''} onChange={(e) => handleChange('valor_minimo_pagamento', e.target.value)} placeholder="100" />
            </ConfigField>
          </ConfigSection>
        </TabsContent>

        {/* NOTIFICAÇÕES */}
        <TabsContent value="notificacoes" className="space-y-4 mt-6">
          <ConfigSection title="Emails do Sistema" description="Endereços que receberão alertas da plataforma" icon={Mail}>
            <div className="grid grid-cols-3 gap-4">
              <ConfigField label="Email Admin" icon={Mail} description="Alertas gerais e segurança">
                <Input type="email" value={configs.email_admin || ''} onChange={(e) => handleChange('email_admin', e.target.value)} placeholder="admin@empresa.com" />
              </ConfigField>
              <ConfigField label="Email Operações" icon={Mail} description="Alertas de novas operações">
                <Input type="email" value={configs.email_operacoes || ''} onChange={(e) => handleChange('email_operacoes', e.target.value)} placeholder="operacoes@empresa.com" />
              </ConfigField>
              <ConfigField label="Email Financeiro" icon={Mail} description="Alertas de comissões e pagamentos">
                <Input type="email" value={configs.email_financeiro || ''} onChange={(e) => handleChange('email_financeiro', e.target.value)} placeholder="financeiro@empresa.com" />
              </ConfigField>
            </div>
          </ConfigSection>

          <ConfigSection title="Gatilhos — Operações" description="Eventos relacionados ao fluxo de operações" icon={Bell}>
            <ToggleRow label="Nova operação criada" description="Notifica quando um parceiro cadastra uma nova operação" checked={configs.notificar_nova_operacao === 'true'} onChange={(v) => handleChange('notificar_nova_operacao', String(v))} />
            <ToggleRow label="Operação mudou de etapa" description="Notifica quando uma operação avança no Kanban" checked={configs.notificar_operacao_etapa === 'true'} onChange={(v) => handleChange('notificar_operacao_etapa', String(v))} />
            <ToggleRow label="Operação concluída" description="Notifica quando uma operação é finalizada com sucesso" checked={configs.notificar_operacao_concluida === 'true'} onChange={(v) => handleChange('notificar_operacao_concluida', String(v))} />
            <ToggleRow label="Operação parada (alerta)" description="Notifica quando uma operação excede o prazo de inatividade" checked={configs.notificar_operacao_parada === 'true'} onChange={(v) => handleChange('notificar_operacao_parada', String(v))} />
          </ConfigSection>

          <ConfigSection title="Gatilhos — Rede & Comissões" description="Eventos da rede de parceiros e comissões" icon={Bell}>
            <ToggleRow label="Novo parceiro indicado" description="Notifica quando um novo parceiro se cadastra via indicação" checked={configs.notificar_novo_parceiro === 'true'} onChange={(v) => handleChange('notificar_novo_parceiro', String(v))} />
            <ToggleRow label="Comissão gerada" description="Notifica quando uma comissão é calculada para pagamento" checked={configs.notificar_comissao_gerada === 'true'} onChange={(v) => handleChange('notificar_comissao_gerada', String(v))} />
            <ToggleRow label="Comissão paga" description="Notifica o parceiro quando o pagamento é confirmado" checked={configs.notificar_comissao_paga === 'true'} onChange={(v) => handleChange('notificar_comissao_paga', String(v))} />
          </ConfigSection>

          <ConfigSection title="Gatilhos — Usuários & Suporte" description="Eventos de cadastro e chamados" icon={Bell}>
            <ToggleRow label="Novo usuário cadastrado" description="Notifica quando um novo usuário completa o cadastro" checked={configs.notificar_novo_usuario === 'true'} onChange={(v) => handleChange('notificar_novo_usuario', String(v))} />
            <ToggleRow label="Novo chamado de suporte" description="Notifica quando um ticket de suporte é aberto" checked={configs.notificar_novo_chamado === 'true'} onChange={(v) => handleChange('notificar_novo_chamado', String(v))} />
            <ToggleRow label="Chamado respondido" description="Notifica o usuário quando o suporte responde" checked={configs.notificar_chamado_respondido === 'true'} onChange={(v) => handleChange('notificar_chamado_respondido', String(v))} />
          </ConfigSection>

          <ConfigSection title="WhatsApp Business" description="Envie notificações automáticas via WhatsApp" icon={MessageCircle} badge="Beta">
            <ToggleRow label="Ativar notificações WhatsApp" description="Envia mensagens automáticas via WhatsApp Business API" checked={configs.whatsapp_ativo === 'true'} onChange={(v) => handleChange('whatsapp_ativo', String(v))} />
            {configs.whatsapp_ativo === 'true' && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <ConfigField label="Número WhatsApp" description="Número conectado à API" icon={MessageCircle}>
                    <Input value={configs.whatsapp_numero || ''} onChange={(e) => handleChange('whatsapp_numero', e.target.value)} placeholder="+55 11 99999-9999" />
                  </ConfigField>
                  <ConfigField label="API Token" description="Token de autenticação" icon={Key}>
                    <Input type="password" value={configs.whatsapp_token || ''} onChange={(e) => handleChange('whatsapp_token', e.target.value)} placeholder="Bearer token..." />
                  </ConfigField>
                </div>
                <ToggleRow label="Operação criada" description="WhatsApp para o admin quando nova operação" checked={configs.whatsapp_nova_operacao === 'true'} onChange={(v) => handleChange('whatsapp_nova_operacao', String(v))} />
                <ToggleRow label="Comissão disponível" description="WhatsApp para o parceiro quando comissão pronta" checked={configs.whatsapp_comissao === 'true'} onChange={(v) => handleChange('whatsapp_comissao', String(v))} />
                <ToggleRow label="Novo parceiro na rede" description="WhatsApp quando alguém se cadastra via indicação" checked={configs.whatsapp_novo_parceiro === 'true'} onChange={(v) => handleChange('whatsapp_novo_parceiro', String(v))} />
              </div>
            )}
          </ConfigSection>

          <ConfigSection title="Preferências Gerais" description="Controle global de frequência e horários" icon={Clock}>
            <div className="grid grid-cols-2 gap-4">
              <ConfigField label="Frequência de resumo" description="Intervalo dos emails de resumo">
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={configs.frequencia_resumo || 'diario'}
                  onChange={(e) => handleChange('frequencia_resumo', e.target.value)}
                >
                  <option value="tempo_real">Tempo real</option>
                  <option value="diario">Diário</option>
                  <option value="semanal">Semanal</option>
                </select>
              </ConfigField>
              <ConfigField label="Horário silencioso" description="Período sem envio de notificações">
                <div className="flex items-center gap-2">
                  <Input type="time" value={configs.horario_silencioso_inicio || '22:00'} onChange={(e) => handleChange('horario_silencioso_inicio', e.target.value)} className="flex-1" />
                  <span className="text-xs text-muted-foreground">até</span>
                  <Input type="time" value={configs.horario_silencioso_fim || '08:00'} onChange={(e) => handleChange('horario_silencioso_fim', e.target.value)} className="flex-1" />
                </div>
              </ConfigField>
            </div>
          </ConfigSection>
        </TabsContent>

        {/* SEGURANÇA */}
        <TabsContent value="seguranca" className="space-y-4 mt-6">
          <ConfigSection title="Sessão e Autenticação" description="Configure tempos e limites de acesso" icon={Lock}>
            <div className="grid grid-cols-3 gap-4">
              <ConfigField label="Tempo de Sessão (min)" description="Inatividade até expirar" icon={Clock}>
                <Input type="number" value={configs.tempo_sessao_minutos || ''} onChange={(e) => handleChange('tempo_sessao_minutos', e.target.value)} placeholder="60" />
              </ConfigField>
              <ConfigField label="Máx. Tentativas de Login" description="Antes de bloquear temporariamente" icon={Lock}>
                <Input type="number" value={configs.max_tentativas_login || ''} onChange={(e) => handleChange('max_tentativas_login', e.target.value)} placeholder="5" />
              </ConfigField>
              <ConfigField label="Bloqueio Temporário (min)" description="Duração do bloqueio após tentativas" icon={Clock}>
                <Input type="number" value={configs.bloqueio_temporario_minutos || ''} onChange={(e) => handleChange('bloqueio_temporario_minutos', e.target.value)} placeholder="15" />
              </ConfigField>
            </div>
          </ConfigSection>

          <ConfigSection title="Políticas de Acesso" description="Regras de verificação e aprovação de usuários" icon={UserCheck}>
            <ToggleRow label="Verificação de email obrigatória" description="Novos usuários precisam confirmar email antes de acessar" checked={configs.exigir_verificacao_email === 'true'} onChange={(v) => handleChange('exigir_verificacao_email', String(v))} />
            <ToggleRow label="Perfil completo obrigatório" description="Exige preenchimento completo do perfil para acessar operações" checked={configs.exigir_perfil_completo === 'true'} onChange={(v) => handleChange('exigir_perfil_completo', String(v))} />
          </ConfigSection>
        </TabsContent>

        {/* PLATAFORMA */}
        <TabsContent value="sistema" className="space-y-4 mt-6">
          <ConfigSection title="Identidade da Plataforma" description="Informações exibidas publicamente" icon={Globe}>
            <div className="grid grid-cols-2 gap-4">
              <ConfigField label="Nome da Plataforma" icon={Globe} description="Nome exibido no header e emails">
                <Input value={configs.nome_plataforma || ''} onChange={(e) => handleChange('nome_plataforma', e.target.value)} placeholder="MAX Capital" />
              </ConfigField>
              <ConfigField label="URL do Site" icon={Globe} description="Endereço principal da plataforma">
                <Input value={configs.url_site || ''} onChange={(e) => handleChange('url_site', e.target.value)} placeholder="https://maxcapital.com.br" />
              </ConfigField>
            </div>
            <ConfigField label="Descrição da Plataforma" description="Texto institucional usado em comunicações">
              <Textarea value={configs.descricao_plataforma || ''} onChange={(e) => handleChange('descricao_plataforma', e.target.value)} placeholder="Plataforma de originação de negócios e investimentos estruturados." rows={2} />
            </ConfigField>
          </ConfigSection>

          <ConfigSection title="Links Legais" description="URLs de termos, políticas e documentos públicos" icon={ExternalLink}>
            <div className="grid grid-cols-2 gap-4">
              <ConfigField label="Termos de Uso" icon={ExternalLink}>
                <Input value={configs.url_termos || ''} onChange={(e) => handleChange('url_termos', e.target.value)} placeholder="https://..." />
              </ConfigField>
              <ConfigField label="Política de Privacidade" icon={ExternalLink}>
                <Input value={configs.url_privacidade || ''} onChange={(e) => handleChange('url_privacidade', e.target.value)} placeholder="https://..." />
              </ConfigField>
              <ConfigField label="Política de Cookies" icon={ExternalLink}>
                <Input value={configs.url_cookies || ''} onChange={(e) => handleChange('url_cookies', e.target.value)} placeholder="https://..." />
              </ConfigField>
              <ConfigField label="Canal de Denúncias" icon={ExternalLink}>
                <Input value={configs.url_denuncias || ''} onChange={(e) => handleChange('url_denuncias', e.target.value)} placeholder="https://..." />
              </ConfigField>
            </div>
          </ConfigSection>


          <ConfigSection title="Manutenção" description="Controle o modo de manutenção da plataforma" icon={Wrench}>
            <ToggleRow label="Modo de Manutenção" description="Bloqueia acesso à plataforma temporariamente" checked={configs.modo_manutencao === 'true'} onChange={(v) => handleChange('modo_manutencao', String(v))} />
            {configs.modo_manutencao === 'true' && (
              <ConfigField label="Mensagem exibida aos usuários">
                <Textarea value={configs.mensagem_manutencao || ''} onChange={(e) => handleChange('mensagem_manutencao', e.target.value)} placeholder="Sistema em manutenção. Voltamos em breve!" rows={2} />
              </ConfigField>
            )}
          </ConfigSection>
        </TabsContent>
        <TabsContent value="imagens" className="space-y-4 mt-6">
          <ConfigSection title="Imagens Hero das Páginas" description="Imagens de fundo das seções hero — use URL ou faça upload" icon={ImageIcon}>
            {[
              { key: 'img_dashboard_hero', label: 'Dashboard (Home)', description: 'Imagem hero da página inicial' },
              { key: 'img_oportunidades_hero', label: 'Oportunidades', description: 'Imagem hero da página de oportunidades' },
              { key: 'img_teses_hero', label: 'Teses de Investimento', description: 'Imagem hero da página de teses' },
              { key: 'img_treinamentos_hero', label: 'Treinamentos', description: 'Imagem hero da página de treinamentos' },
              { key: 'img_materiais_hero', label: 'Kit Comercial / Materiais', description: 'Imagem hero da página de materiais' },
              { key: 'img_guias_hero', label: 'Guias', description: 'Imagem hero da página de guias' },
              { key: 'img_relatorios_hero', label: 'Relatórios (Parceiro)', description: 'Imagem hero do relatório de parceiros' },
              { key: 'img_relatorios_admin_hero', label: 'Relatórios (Admin)', description: 'Imagem hero do relatório de administradores' },
              { key: 'img_relatorios_empresa_hero', label: 'Relatórios (Empresa)', description: 'Imagem hero do relatório de empresas' },
              { key: 'img_relatorios_investidor_hero', label: 'Relatórios (Investidor)', description: 'Imagem hero do relatório de investidores' },
            ].map((item) => (
              <ImageConfigField key={item.key} configKey={item.key} label={item.label} description={item.description} value={configs[item.key] || ''} onChange={handleChange} onClear={() => handleChange(item.key, '')} />
            ))}
          </ConfigSection>

          <ConfigSection title="Imagens de Autenticação" description="Imagens das telas de login e cadastro" icon={ImageIcon}>
            {[
              { key: 'img_login_hero', label: 'Tela de Login', description: 'Imagem lateral da página de login' },
              { key: 'img_registro_hero', label: 'Tela de Cadastro', description: 'Imagem lateral da página de registro' },
            ].map((item) => (
              <ImageConfigField key={item.key} configKey={item.key} label={item.label} description={item.description} value={configs[item.key] || ''} onChange={handleChange} onClear={() => handleChange(item.key, '')} />
            ))}
          </ConfigSection>

          <ConfigSection title="Imagens de Perfil (Seleção)" description="Cards de seleção de perfil no cadastro" icon={ImageIcon}>
            {[
              { key: 'img_perfil_parceiro', label: 'Perfil Parceiro', description: 'Card de seleção do perfil parceiro' },
              { key: 'img_perfil_empresa', label: 'Perfil Empresa', description: 'Card de seleção do perfil empresa' },
              { key: 'img_perfil_investidor', label: 'Perfil Investidor', description: 'Card de seleção do perfil investidor' },
            ].map((item) => (
              <ImageConfigField key={item.key} configKey={item.key} label={item.label} description={item.description} value={configs[item.key] || ''} onChange={handleChange} onClear={() => handleChange(item.key, '')} />
            ))}
          </ConfigSection>
        </TabsContent>

        {/* INTEGRAÇÕES */}
        <TabsContent value="integracoes" className="space-y-4 mt-6">
          <ConfigSection title="Integrações Ativas" description="Gerencie suas integrações com serviços externos" icon={Plug}>
            {[
              { name: 'Webhook de Operações', key: 'webhook_operacoes', icon: Webhook, description: 'Dispara eventos quando operações mudam de status', statusKey: 'webhook_operacoes_ativo' },
              { name: 'API Externa (CRM)', key: 'api_crm', icon: ExternalLink, description: 'Sincroniza dados com seu CRM externo', statusKey: 'api_crm_ativo' },
              { name: 'Gateway de Pagamento', key: 'gateway_pagamento', icon: DollarSign, description: 'Processa pagamentos de comissões automaticamente', statusKey: 'gateway_pagamento_ativo' },
              { name: 'Serviço de Email (SMTP)', key: 'smtp', icon: Mail, description: 'Envia emails transacionais pela plataforma', statusKey: 'smtp_ativo' },
            ].map((integration) => {
              const isActive = configs[integration.statusKey] === 'true';
              return (
                <div key={integration.key} className="flex items-start gap-4 py-4 border-b border-border/10 last:border-0">
                  <div className={cn("p-2.5 rounded-lg", isActive ? "bg-primary/10" : "bg-muted/50")}>
                    <integration.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{integration.name}</span>
                      {isActive ? (
                        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">Ativo</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Inativo</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{integration.description}</p>
                  </div>
                  <Switch checked={isActive} onCheckedChange={(v) => handleChange(integration.statusKey, String(v))} />
                </div>
              );
            })}
          </ConfigSection>

          <ConfigSection title="Credenciais de API" description="Chaves e tokens para autenticação" icon={Key} badge="Sensível">
            <div className="grid grid-cols-2 gap-4">
              <ConfigField label="Webhook URL" description="URL de callback para eventos" icon={Webhook}>
                <Input value={configs.webhook_url || ''} onChange={(e) => handleChange('webhook_url', e.target.value)} placeholder="https://api.exemplo.com/webhook" />
              </ConfigField>
              <ConfigField label="API Key (CRM)" description="Token de autenticação do CRM" icon={Key}>
                <Input type="password" value={configs.api_key_crm || ''} onChange={(e) => handleChange('api_key_crm', e.target.value)} placeholder="sk-..." />
              </ConfigField>
              <ConfigField label="SMTP Host" icon={Mail}>
                <Input value={configs.smtp_host || ''} onChange={(e) => handleChange('smtp_host', e.target.value)} placeholder="smtp.gmail.com" />
              </ConfigField>
              <ConfigField label="SMTP Porta" icon={Mail}>
                <Input type="number" value={configs.smtp_porta || ''} onChange={(e) => handleChange('smtp_porta', e.target.value)} placeholder="587" />
              </ConfigField>
            </div>
          </ConfigSection>

          <ConfigSection title="Novas Integrações" description="Adicione integrações futuras à plataforma" icon={Plus}>
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: 'WhatsApp Business', description: 'Notificações via WhatsApp', available: false },
                { name: 'Slack', description: 'Alertas em canais do Slack', available: false },
                { name: 'Zapier', description: 'Automatize fluxos com Zapier', available: false },
                { name: 'Google Sheets', description: 'Exportar dados para planilhas', available: false },
                { name: 'DocuSign', description: 'Assinatura digital de contratos', available: false },
                { name: 'Power BI', description: 'Dashboards avançados', available: false },
              ].map((item) => (
                <div key={item.name} className="flex flex-col items-center gap-2 p-4 rounded-lg border border-dashed border-border/40 bg-muted/20 text-center opacity-60">
                  <Plug className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">{item.name}</span>
                  <span className="text-[10px] text-muted-foreground">{item.description}</span>
                  <Badge variant="outline" className="text-[9px]">Em breve</Badge>
                </div>
              ))}
            </div>
           </ConfigSection>

          {/* MCP Integrations */}
          <ConfigSection title="Integrações MCP" description="Model Context Protocol — conecte agentes de IA a serviços externos" icon={Cpu} badge="Futuro">
            <p className="text-xs text-muted-foreground mb-4">
              O MCP (Model Context Protocol) permite que agentes de IA acessem dados em tempo real de ferramentas externas como Notion, Linear, Jira e mais. Configure conexões para enriquecer automações e fluxos inteligentes da plataforma.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: 'Notion', description: 'Acesse páginas e databases do Notion', icon: Database },
                { name: 'Linear', description: 'Issues e projetos do Linear', icon: Zap },
                { name: 'Jira / Confluence', description: 'Tickets e documentação Atlassian', icon: ExternalLink },
                { name: 'n8n', description: 'Workflows de automação via MCP', icon: Webhook },
                { name: 'Miro', description: 'Boards e diagramas do Miro', icon: Eye },
                { name: 'Amplitude', description: 'Analytics e feedback de produto', icon: TrendingUp },
                { name: 'Google Drive', description: 'Acesse e gerencie arquivos do Drive', icon: HardDrive },
                { name: 'Slack', description: 'Mensagens e notificações em canais', icon: MessageCircle },
                { name: 'Polar', description: 'Billing e assinaturas recorrentes', icon: CreditCard },
                { name: 'Google Sheets', description: 'Leitura e escrita em planilhas', icon: FileSpreadsheet },
                { name: 'ElevenLabs', description: 'Geração de voz e text-to-speech', icon: Mic },
                { name: 'Perplexity', description: 'Busca inteligente com IA', icon: Search },
              ].map((item) => (
                <div key={item.name} className="flex flex-col items-center gap-2.5 p-5 rounded-xl border border-dashed border-border/40 bg-muted/20 text-center hover:bg-muted/30 transition-colors">
                  <div className="p-2.5 rounded-lg bg-muted/50">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">{item.name}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">{item.description}</span>
                  <Badge variant="outline" className="text-[9px] mt-1">Em breve</Badge>
                </div>
              ))}
            </div>
          </ConfigSection>
        </TabsContent>

      </Tabs>
    </motion.div>
  );
}
