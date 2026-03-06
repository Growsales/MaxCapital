import { useState, useEffect } from 'react';
import { User, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/types/supabase';
import type { User as AuthUser } from '@supabase/supabase-js';

interface PersonalInfoTabProps {
  profile: Tables<'profiles'> | null;
  user: AuthUser | null;
  profileDetails: ProfileDetails | null;
  onUpdate: () => void;
}

export interface ProfileDetails {
  id: string;
  user_id: string;
  cpf: string | null;
  data_nascimento: string | null;
  endereco_cep: string | null;
  endereco_logradouro: string | null;
  endereco_numero: string | null;
  endereco_complemento: string | null;
  endereco_bairro: string | null;
  endereco_cidade: string | null;
  endereco_uf: string | null;
  // Professional
  profissao: string | null;
  empresa_atual: string | null;
  cargo: string | null;
  linkedin_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  experiencia_anos: number | null;
  areas_atuacao: string[] | null;
  // Banking
  banco_nome: string | null;
  banco_agencia: string | null;
  banco_conta: string | null;
  banco_tipo_conta: string | null;
  pix_tipo: string | null;
  pix_chave: string | null;
  // Referral
  codigo_indicacao: string | null;
  indicado_por: string | null;
  // Notifications
  notif_email: boolean;
  notif_whatsapp: boolean;
  notif_push: boolean;
  notif_operacoes: boolean;
  notif_materiais: boolean;
  notif_treinamentos: boolean;
  // Theme
  tema_preferido: 'light' | 'dark' | null;
}

export default function PersonalInfoTab({ profile, user, profileDetails, onUpdate }: PersonalInfoTabProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    telefone: '',
    cpf: '',
    data_nascimento: '',
    cnpj: '',
    razao_social: '',
    endereco_cep: '',
    endereco_logradouro: '',
    endereco_numero: '',
    endereco_complemento: '',
    endereco_bairro: '',
    endereco_cidade: '',
    endereco_uf: '',
  });

  useEffect(() => {
    if (profile) {
      const nameParts = profile.nome?.split(' ') || [''];
      setFormData(prev => ({
        ...prev,
        nome: nameParts[0] || '',
        sobrenome: nameParts.slice(1).join(' ') || '',
        telefone: profile.telefone || '',
        cpf: profileDetails?.cpf || '',
        data_nascimento: profileDetails?.data_nascimento || '',
        cnpj: (profileDetails as any)?.cnpj || '',
        razao_social: (profileDetails as any)?.razao_social || '',
        endereco_cep: profileDetails?.endereco_cep || '',
        endereco_logradouro: profileDetails?.endereco_logradouro || '',
        endereco_numero: profileDetails?.endereco_numero || '',
        endereco_complemento: profileDetails?.endereco_complemento || '',
        endereco_bairro: profileDetails?.endereco_bairro || '',
        endereco_cidade: profileDetails?.endereco_cidade || '',
        endereco_uf: profileDetails?.endereco_uf || '',
      }));
    }
  }, [profile, profileDetails]);

  const handleCepBlur = async () => {
    const cep = formData.endereco_cep.replace(/\D/g, '');
    if (cep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          endereco_logradouro: data.logradouro || '',
          endereco_bairro: data.bairro || '',
          endereco_cidade: data.localidade || '',
          endereco_uf: data.uf || '',
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 8);
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const handleSave = async () => {
    if (!profile?.id) return;
    
    setSaving(true);
    try {
      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nome: `${formData.nome} ${formData.sobrenome}`.trim(),
          telefone: formData.telefone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // Upsert profile_details
      const { error: detailsError } = await supabase
        .from('profile_details')
        .upsert({
          user_id: profile.id,
          cpf: formData.cpf || null,
          data_nascimento: formData.data_nascimento || null,
          cnpj: formData.cnpj || null,
          razao_social: formData.razao_social || null,
          endereco_cep: formData.endereco_cep || null,
          endereco_logradouro: formData.endereco_logradouro || null,
          endereco_numero: formData.endereco_numero || null,
          endereco_complemento: formData.endereco_complemento || null,
          endereco_bairro: formData.endereco_bairro || null,
          endereco_cidade: formData.endereco_cidade || null,
          endereco_uf: formData.endereco_uf || null,
        }, {
          onConflict: 'user_id',
        });

      if (detailsError) throw detailsError;

      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram salvas com sucesso.',
      });
      
      onUpdate();
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível atualizar suas informações.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="dashboard-card">
          <div className="flex items-center gap-2 mb-6">
            <User className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Informações Básicas</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input 
                value={formData.nome} 
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                className="form-input" 
              />
            </div>
            <div className="space-y-2">
              <Label>Sobrenome</Label>
              <Input 
                value={formData.sobrenome} 
                onChange={(e) => setFormData(prev => ({ ...prev, sobrenome: e.target.value }))}
                className="form-input" 
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>CPF</Label>
              <Input 
                value={formData.cpf}
                onChange={(e) => setFormData(prev => ({ ...prev, cpf: formatCPF(e.target.value) }))}
                placeholder="000.000.000-00"
                className="form-input" 
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Data de Nascimento</Label>
              <Input 
                type="date" 
                value={formData.data_nascimento}
                onChange={(e) => setFormData(prev => ({ ...prev, data_nascimento: e.target.value }))}
                className="form-input" 
              />
            </div>
            {profile?.tipo === 'investidor' && (profileDetails as any)?.tipo_pessoa === 'PJ' && (
              <>
                <div className="col-span-2 space-y-2">
                  <Label>CNPJ</Label>
                  <Input 
                    value={formData.cnpj}
                    onChange={(e) => {
                      const numbers = e.target.value.replace(/\D/g, '').slice(0, 14);
                      const formatted = numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
                      setFormData(prev => ({ ...prev, cnpj: formatted }));
                    }}
                    placeholder="00.000.000/0000-00"
                    className="form-input" 
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Razão Social</Label>
                  <Input 
                    value={formData.razao_social}
                    onChange={(e) => setFormData(prev => ({ ...prev, razao_social: e.target.value }))}
                    placeholder="Razão Social da empresa"
                    className="form-input" 
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Contact */}
        <div className="dashboard-card">
          <div className="flex items-center gap-2 mb-6">
            <Mail className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Contato</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input 
                value={profile?.email || user?.email || ''} 
                disabled
                className="form-input opacity-60" 
              />
              <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado</p>
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input 
                value={formData.telefone}
                onChange={(e) => setFormData(prev => ({ ...prev, telefone: formatPhone(e.target.value) }))}
                placeholder="(00) 00000-0000"
                className="form-input" 
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="dashboard-card md:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="font-semibold text-foreground">Endereço</h3>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>CEP</Label>
              <Input 
                value={formData.endereco_cep}
                onChange={(e) => setFormData(prev => ({ ...prev, endereco_cep: formatCEP(e.target.value) }))}
                onBlur={handleCepBlur}
                placeholder="00000-000" 
                className="form-input" 
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Rua</Label>
              <Input 
                value={formData.endereco_logradouro}
                onChange={(e) => setFormData(prev => ({ ...prev, endereco_logradouro: e.target.value }))}
                placeholder="Nome da rua" 
                className="form-input" 
              />
            </div>
            <div className="space-y-2">
              <Label>Número</Label>
              <Input 
                value={formData.endereco_numero}
                onChange={(e) => setFormData(prev => ({ ...prev, endereco_numero: e.target.value }))}
                placeholder="000" 
                className="form-input" 
              />
            </div>
            <div className="space-y-2">
              <Label>Complemento</Label>
              <Input 
                value={formData.endereco_complemento}
                onChange={(e) => setFormData(prev => ({ ...prev, endereco_complemento: e.target.value }))}
                placeholder="Apto, sala..." 
                className="form-input" 
              />
            </div>
            <div className="space-y-2">
              <Label>Bairro</Label>
              <Input 
                value={formData.endereco_bairro}
                onChange={(e) => setFormData(prev => ({ ...prev, endereco_bairro: e.target.value }))}
                placeholder="Bairro" 
                className="form-input" 
              />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input 
                value={formData.endereco_cidade}
                onChange={(e) => setFormData(prev => ({ ...prev, endereco_cidade: e.target.value }))}
                placeholder="Cidade" 
                className="form-input" 
              />
            </div>
            <div className="space-y-2">
              <Label>UF</Label>
              <Input 
                value={formData.endereco_uf}
                onChange={(e) => setFormData(prev => ({ ...prev, endereco_uf: e.target.value.toUpperCase().slice(0, 2) }))}
                placeholder="UF" 
                className="form-input" 
                maxLength={2}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          className="btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Alterações'
          )}
        </Button>
      </div>
    </div>
  );
}
