import { useState, useEffect } from 'react';
import { Briefcase, Linkedin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/types/supabase';
import type { ProfileDetails } from './PersonalInfoTab';

interface ProfessionalInfoTabProps {
  profile: Tables<'profiles'> | null;
  profileDetails: ProfileDetails | null;
  onUpdate: () => void;
}

const AREAS_ATUACAO = [
  'Comercial',
  'Financeiro',
  'Jurídico',
  'Marketing',
  'Operações',
  'Recursos Humanos',
  'Tecnologia',
  'Consultoria',
  'Investimentos',
  'Outros'
];

export default function ProfessionalInfoTab({ profile, profileDetails, onUpdate }: ProfessionalInfoTabProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [urlErrors, setUrlErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    profissao: '',
    empresa_atual: '',
    cargo: '',
    linkedin_url: '',
    facebook_url: '',
    instagram_url: '',
    experiencia_anos: '',
    areas_atuacao: [] as string[],
  });

  useEffect(() => {
    if (profileDetails) {
      setFormData({
        profissao: profileDetails.profissao || '',
        empresa_atual: profileDetails.empresa_atual || '',
        cargo: profileDetails.cargo || '',
        linkedin_url: profileDetails.linkedin_url || '',
        facebook_url: profileDetails.facebook_url || '',
        instagram_url: profileDetails.instagram_url || '',
        experiencia_anos: profileDetails.experiencia_anos?.toString() || '',
        areas_atuacao: profileDetails.areas_atuacao || [],
      });
    }
  }, [profileDetails]);

  const toggleArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      areas_atuacao: prev.areas_atuacao.includes(area)
        ? prev.areas_atuacao.filter(a => a !== area)
        : [...prev.areas_atuacao, area]
    }));
  };

  const validateUrl = (value: string, domain: string): string => {
    if (!value) return '';
    try {
      const url = new URL(value);
      if (!url.hostname.includes(domain)) return `URL deve ser do ${domain}`;
      return '';
    } catch {
      return 'URL inválida';
    }
  };

  const handleSave = async () => {
    if (!profile?.id) return;

    const errors: Record<string, string> = {};
    if (formData.linkedin_url) errors.linkedin = validateUrl(formData.linkedin_url, 'linkedin.com');
    if (formData.facebook_url) errors.facebook = validateUrl(formData.facebook_url, 'facebook.com');
    if (formData.instagram_url) errors.instagram = validateUrl(formData.instagram_url, 'instagram.com');

    const hasErrors = Object.values(errors).some(e => e);
    setUrlErrors(errors);
    if (hasErrors) {
      toast({ title: 'URLs inválidas', description: 'Corrija os campos de redes sociais.', variant: 'destructive' });
      return;
    }
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profile_details')
        .upsert({
          user_id: profile.id,
          profissao: formData.profissao || null,
          empresa_atual: formData.empresa_atual || null,
          cargo: formData.cargo || null,
          linkedin_url: formData.linkedin_url || null,
          facebook_url: formData.facebook_url || null,
          instagram_url: formData.instagram_url || null,
          experiencia_anos: formData.experiencia_anos ? parseInt(formData.experiencia_anos) : null,
          areas_atuacao: formData.areas_atuacao.length > 0 ? formData.areas_atuacao : null,
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      toast({
        title: 'Informações profissionais atualizadas',
        description: 'Seus dados profissionais foram salvos com sucesso.',
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
        {/* Professional Data */}
        <div className="dashboard-card">
          <div className="flex items-center gap-2 mb-6">
            <Briefcase className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Dados Profissionais</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Profissão</Label>
              <Input 
                value={formData.profissao}
                onChange={(e) => setFormData(prev => ({ ...prev, profissao: e.target.value }))}
                placeholder="Ex: Analista Financeiro"
                className="form-input" 
              />
            </div>
            <div className="space-y-2">
              <Label>Empresa Atual</Label>
              <Input 
                value={formData.empresa_atual}
                onChange={(e) => setFormData(prev => ({ ...prev, empresa_atual: e.target.value }))}
                placeholder="Nome da empresa"
                className="form-input" 
              />
            </div>
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Input 
                value={formData.cargo}
                onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))}
                placeholder="Seu cargo atual"
                className="form-input" 
              />
            </div>
            <div className="space-y-2">
              <Label>Anos de Experiência</Label>
              <Select
                value={formData.experiencia_anos}
                onValueChange={(value) => setFormData(prev => ({ ...prev, experiencia_anos: value }))}
              >
                <SelectTrigger className="form-input">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Menos de 1 ano</SelectItem>
                  <SelectItem value="1">1-2 anos</SelectItem>
                  <SelectItem value="3">3-5 anos</SelectItem>
                  <SelectItem value="6">6-10 anos</SelectItem>
                  <SelectItem value="11">11-15 anos</SelectItem>
                  <SelectItem value="16">16-20 anos</SelectItem>
                  <SelectItem value="21">Mais de 20 anos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Social & Links */}
        <div className="dashboard-card">
          <div className="flex items-center gap-2 mb-6">
            <Linkedin className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Redes e Links</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </Label>
              <Input 
                value={formData.linkedin_url}
                onChange={(e) => { setFormData(prev => ({ ...prev, linkedin_url: e.target.value })); setUrlErrors(prev => ({ ...prev, linkedin: '' })); }}
                placeholder="https://linkedin.com/in/seu-perfil"
                className={`form-input ${urlErrors.linkedin ? 'border-red-500' : ''}`}
              />
              {urlErrors.linkedin && <p className="text-sm text-red-500">{urlErrors.linkedin}</p>}
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Facebook
              </Label>
              <Input 
                value={formData.facebook_url}
                onChange={(e) => { setFormData(prev => ({ ...prev, facebook_url: e.target.value })); setUrlErrors(prev => ({ ...prev, facebook: '' })); }}
                placeholder="https://facebook.com/seu-perfil"
                className={`form-input ${urlErrors.facebook ? 'border-red-500' : ''}`}
              />
              {urlErrors.facebook && <p className="text-sm text-red-500">{urlErrors.facebook}</p>}
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                Instagram
              </Label>
              <Input 
                value={formData.instagram_url}
                onChange={(e) => { setFormData(prev => ({ ...prev, instagram_url: e.target.value })); setUrlErrors(prev => ({ ...prev, instagram: '' })); }}
                placeholder="https://instagram.com/seu-perfil"
                className={`form-input ${urlErrors.instagram ? 'border-red-500' : ''}`}
              />
              {urlErrors.instagram && <p className="text-sm text-red-500">{urlErrors.instagram}</p>}
            </div>
          </div>
        </div>

        {/* Areas of Expertise */}
        <div className="dashboard-card md:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <h3 className="font-semibold text-foreground">Áreas de Atuação</h3>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">Selecione as áreas em que você tem experiência ou interesse</p>
          
          <div className="flex flex-wrap gap-2">
            {AREAS_ATUACAO.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => toggleArea(area)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  formData.areas_atuacao.includes(area)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {area}
              </button>
            ))}
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
