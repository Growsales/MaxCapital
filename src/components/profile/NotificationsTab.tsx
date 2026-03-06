import { useState, useEffect } from 'react';
import { 
  Bell, Mail, MessageSquare, Smartphone, Loader2, 
  TrendingUp, Package, GraduationCap, Users, Shield,
  DollarSign, Clock, Moon, Info, CheckCircle2, BellOff,
  Megaphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/shared/components/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/shared/components/select';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Tables } from '@/types/supabase';
import type { ProfileDetails } from './PersonalInfoTab';

interface NotificationsTabProps {
  profile: Tables<'profiles'> | null;
  profileDetails: ProfileDetails | null;
  onUpdate: () => void;
}

// Channel item component
function ChannelRow({ icon: Icon, iconBg, label, description, checked, onChange }: {
  icon: React.ElementType; iconBg: string; label: string; description: string;
  checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-border/10 last:border-0">
      <div className="flex items-center gap-3">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", iconBg)}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <Label className="text-sm font-medium">{label}</Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

// Notification type row
function TypeRow({ icon: Icon, label, description, checked, onChange, locked }: {
  icon: React.ElementType; label: string; description: string;
  checked: boolean; onChange: (v: boolean) => void; locked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-border/10 last:border-0">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">{label}</Label>
            {locked && <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-warning/30 text-warning">Obrigatória</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={locked} />
    </div>
  );
}

export default function NotificationsTab({ profile, profileDetails, onUpdate }: NotificationsTabProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    notif_email: true,
    notif_whatsapp: true,
    notif_push: true,
    notif_operacoes: true,
    notif_materiais: true,
    notif_treinamentos: true,
    notif_comissoes: true,
    notif_rede: true,
    notif_seguranca: true,
    notif_novidades: true,
    resumo_frequencia: 'diario',
    horario_silencioso: false,
    horario_inicio: '22:00',
    horario_fim: '08:00',
  });

  useEffect(() => {
    if (profileDetails) {
      setSettings(prev => ({
        ...prev,
        notif_email: profileDetails.notif_email ?? true,
        notif_whatsapp: profileDetails.notif_whatsapp ?? true,
        notif_push: profileDetails.notif_push ?? true,
        notif_operacoes: profileDetails.notif_operacoes ?? true,
        notif_materiais: profileDetails.notif_materiais ?? true,
        notif_treinamentos: profileDetails.notif_treinamentos ?? true,
      }));
    }
  }, [profileDetails]);

  const handleSave = async () => {
    if (!profile?.id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profile_details')
        .upsert({
          user_id: profile.id,
          notif_email: settings.notif_email,
          notif_whatsapp: settings.notif_whatsapp,
          notif_push: settings.notif_push,
          notif_operacoes: settings.notif_operacoes,
          notif_materiais: settings.notif_materiais,
          notif_treinamentos: settings.notif_treinamentos,
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      toast({
        title: 'Preferências atualizadas',
        description: 'Suas preferências de notificação foram salvas.',
      });
      
      onUpdate();
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível atualizar suas preferências.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const activeChannels = [settings.notif_email, settings.notif_whatsapp, settings.notif_push].filter(Boolean).length;
  const activeTypes = [settings.notif_operacoes, settings.notif_materiais, settings.notif_treinamentos, settings.notif_comissoes, settings.notif_rede, settings.notif_novidades].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex items-center gap-4 p-3 rounded-xl bg-card">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">{activeChannels} canais ativos</span>
        </div>
        <div className="w-px h-4 bg-border/50" />
        <div className="flex items-center gap-2 text-sm">
          <Bell className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">{activeTypes} tipos ativos</span>
        </div>
        {settings.horario_silencioso && (
          <>
            <div className="w-px h-4 bg-border/50" />
            <div className="flex items-center gap-2 text-sm">
              <Moon className="h-4 w-4 text-warning" />
              <span className="text-muted-foreground">Silencioso {settings.horario_inicio}–{settings.horario_fim}</span>
            </div>
          </>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Notification Channels */}
        <div className="rounded-xl bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Canais de Notificação</h3>
          </div>
          
          <ChannelRow
            icon={Mail} iconBg="bg-primary/10 text-primary"
            label="E-mail" description="Receber notificações por e-mail"
            checked={settings.notif_email}
            onChange={(v) => setSettings(prev => ({ ...prev, notif_email: v }))}
          />
          <ChannelRow
            icon={MessageSquare} iconBg="bg-emerald-500/10 text-emerald-500"
            label="WhatsApp" description="Receber notificações via WhatsApp"
            checked={settings.notif_whatsapp}
            onChange={(v) => setSettings(prev => ({ ...prev, notif_whatsapp: v }))}
          />
          <ChannelRow
            icon={Smartphone} iconBg="bg-sky-500/10 text-sky-500"
            label="Push" description="Receber notificações push no navegador"
            checked={settings.notif_push}
            onChange={(v) => setSettings(prev => ({ ...prev, notif_push: v }))}
          />

          {/* Quick toggle all */}
          <div className="mt-4 pt-3 border-t border-border/10">
            <button
              type="button"
              onClick={() => {
                const allOn = settings.notif_email && settings.notif_whatsapp && settings.notif_push;
                setSettings(prev => ({ ...prev, notif_email: !allOn, notif_whatsapp: !allOn, notif_push: !allOn }));
              }}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <BellOff className="h-3.5 w-3.5" />
              {settings.notif_email && settings.notif_whatsapp && settings.notif_push ? 'Desativar todos' : 'Ativar todos'}
            </button>
          </div>
        </div>

        {/* Notification Types */}
        <div className="rounded-xl bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h3 className="text-sm font-semibold text-foreground">Tipos de Notificação</h3>
          </div>
          
          <TypeRow icon={TrendingUp} label="Operações" description="Atualizações sobre suas operações" checked={settings.notif_operacoes} onChange={(v) => setSettings(prev => ({ ...prev, notif_operacoes: v }))} />
          <TypeRow icon={Package} label="Novos Materiais" description="Quando novos materiais são publicados" checked={settings.notif_materiais} onChange={(v) => setSettings(prev => ({ ...prev, notif_materiais: v }))} />
          <TypeRow icon={GraduationCap} label="Treinamentos" description="Lembretes e novos treinamentos" checked={settings.notif_treinamentos} onChange={(v) => setSettings(prev => ({ ...prev, notif_treinamentos: v }))} />
          <TypeRow icon={DollarSign} label="Comissões" description="Pagamentos e atualizações financeiras" checked={settings.notif_comissoes} onChange={(v) => setSettings(prev => ({ ...prev, notif_comissoes: v }))} />
          <TypeRow icon={Users} label="Rede de Indicações" description="Novas indicações e movimentações" checked={settings.notif_rede} onChange={(v) => setSettings(prev => ({ ...prev, notif_rede: v }))} />
          <TypeRow icon={Megaphone} label="Novidades" description="Novos recursos e atualizações da plataforma" checked={settings.notif_novidades} onChange={(v) => setSettings(prev => ({ ...prev, notif_novidades: v }))} />
          <TypeRow icon={Shield} label="Segurança" description="Alertas de login e atividade suspeita" checked={settings.notif_seguranca} onChange={(v) => setSettings(prev => ({ ...prev, notif_seguranca: v }))} locked />
        </div>

        {/* Frequency & Quiet Hours */}
        <div className="rounded-xl bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Frequência e Horários</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Resumo por e-mail</Label>
              <Select value={settings.resumo_frequencia} onValueChange={(v) => setSettings(prev => ({ ...prev, resumo_frequencia: v }))}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tempo_real">Tempo real</SelectItem>
                  <SelectItem value="diario">Resumo diário</SelectItem>
                  <SelectItem value="semanal">Resumo semanal</SelectItem>
                  <SelectItem value="desativado">Desativado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-border/10">
              <div className="flex items-center gap-3">
                <Moon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Horário Silencioso</Label>
                  <p className="text-xs text-muted-foreground">Pausar notificações push em horários definidos</p>
                </div>
              </div>
              <Switch checked={settings.horario_silencioso} onCheckedChange={(v) => setSettings(prev => ({ ...prev, horario_silencioso: v }))} />
            </div>

            {settings.horario_silencioso && (
              <div className="grid grid-cols-2 gap-3 pl-7">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Início</Label>
                  <Select value={settings.horario_inicio} onValueChange={(v) => setSettings(prev => ({ ...prev, horario_inicio: v }))}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['20:00', '21:00', '22:00', '23:00'].map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Fim</Label>
                  <Select value={settings.horario_fim} onValueChange={(v) => setSettings(prev => ({ ...prev, horario_fim: v }))}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['06:00', '07:00', '08:00', '09:00', '10:00'].map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="rounded-xl bg-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Sobre suas notificações</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Você pode desativar notificações específicas a qualquer momento. Notificações de <span className="text-foreground font-medium">segurança</span> são obrigatórias e não podem ser desativadas para garantir a proteção da sua conta e transações financeiras.
            </p>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-muted/30">
            <p className="text-[11px] text-muted-foreground">
              💡 <span className="font-medium text-foreground/80">Dica:</span> Use o resumo diário por e-mail para reduzir interrupções sem perder nenhuma atualização importante.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Preferências'
          )}
        </Button>
      </div>
    </div>
  );
}
