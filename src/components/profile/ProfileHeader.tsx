import { useState, useRef } from 'react';
import { 
  Briefcase, 
  MapPin, 
  Mail, 
  Phone, 
  Upload, 
  Loader2,
  Camera
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/types/supabase';
import type { User } from '@supabase/supabase-js';

interface ProfileHeaderProps {
  profile: Tables<'profiles'> | null;
  user: User | null;
  onAvatarUpdate: (url: string) => void;
}

export default function ProfileHeader({ profile, user, onAvatarUpdate }: ProfileHeaderProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const displayName = profile?.nome || user?.email?.split('@')[0] || 'Usuário';

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile?.id) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione uma imagem.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo é 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Create unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      onAvatarUpdate(publicUrl);
      
      toast({
        title: 'Foto atualizada',
        description: 'Sua foto de perfil foi alterada com sucesso.',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Erro no upload',
        description: error.message || 'Não foi possível enviar a imagem.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const getUserTypeLabel = (tipo?: string) => {
    switch (tipo) {
      case 'parceiro': return 'Parceiro';
      case 'empresa': return 'Empresa';
      case 'investidor': return 'Investidor';
      case 'admin': return 'Administrador';
      case 'master': return 'Master';
      default: return 'Usuário';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'ativo': return 'Ativo';
      case 'pendente_aprovacao': return 'Pendente';
      case 'inativo': return 'Inativo';
      default: return 'Pendente';
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden bg-card shadow-sm">
      {/* Cover with gradient */}
      <div className="h-36 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent" />
      
      {/* Avatar & Info */}
      <div className="flex flex-col md:flex-row md:items-center gap-5 px-6 pb-6 -mt-14">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="h-24 w-24 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold border-4 border-card overflow-hidden shadow-lg">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={displayName} 
                className="h-full w-full object-cover" 
              />
            ) : (
              getInitials(displayName)
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-md border-2 border-card"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </button>
        </div>
        
        {/* Info */}
        <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 md:pt-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{displayName}</h1>
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <Briefcase className="h-3.5 w-3.5" />
              {getUserTypeLabel(profile?.tipo)}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {profile?.email || user?.email}
              </span>
              {profile?.telefone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {profile.telefone}
                </span>
              )}
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold self-start md:self-center">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            {getStatusLabel(profile?.status)}
          </span>
        </div>
      </div>
    </div>
  );
}
