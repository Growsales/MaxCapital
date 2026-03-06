import { useState } from 'react';
import { Shield, Key, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function SecurityTab() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecial,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumber,
    };
  };

  const passwordValidation = validatePassword(formData.newPassword);
  const passwordsMatch = formData.newPassword === formData.confirmPassword && formData.confirmPassword !== '';

  const handleChangePassword = async () => {
    if (!passwordValidation.isValid) {
      toast({
        title: 'Senha inválida',
        description: 'A nova senha não atende aos requisitos mínimos.',
        variant: 'destructive',
      });
      return;
    }

    if (!passwordsMatch) {
      toast({
        title: 'Senhas não conferem',
        description: 'A confirmação de senha não corresponde à nova senha.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (error) throw error;

      toast({
        title: 'Senha alterada',
        description: 'Sua senha foi atualizada com sucesso.',
      });
      
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Password change error:', error);
      toast({
        title: 'Erro ao alterar senha',
        description: error.message || 'Não foi possível alterar sua senha.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Change Password */}
        <div className="dashboard-card">
          <div className="flex items-center gap-2 mb-6">
            <Key className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Alterar Senha</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <div className="relative">
                <Input 
                  type={showNewPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Digite a nova senha"
                  className="form-input pr-10" 
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Confirmar Nova Senha</Label>
              <div className="relative">
                <Input 
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirme a nova senha"
                  className="form-input pr-10" 
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formData.confirmPassword && (
                <p className={`text-xs ${passwordsMatch ? 'text-green-500' : 'text-destructive'}`}>
                  {passwordsMatch ? '✓ Senhas conferem' : '✗ Senhas não conferem'}
                </p>
              )}
            </div>

            <Button 
              className="btn-primary w-full"
              onClick={handleChangePassword}
              disabled={saving || !passwordValidation.isValid || !passwordsMatch}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Alterando...
                </>
              ) : (
                'Alterar Senha'
              )}
            </Button>
          </div>
        </div>

        {/* Password Requirements */}
        <div className="dashboard-card">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Requisitos de Senha</h3>
          </div>
          
          <div className="space-y-3">
            <div className={`flex items-center gap-2 text-sm ${passwordValidation.minLength ? 'text-green-500' : 'text-muted-foreground'}`}>
              {passwordValidation.minLength ? '✓' : '○'} Mínimo de 8 caracteres
            </div>
            <div className={`flex items-center gap-2 text-sm ${passwordValidation.hasUpperCase ? 'text-green-500' : 'text-muted-foreground'}`}>
              {passwordValidation.hasUpperCase ? '✓' : '○'} Uma letra maiúscula
            </div>
            <div className={`flex items-center gap-2 text-sm ${passwordValidation.hasLowerCase ? 'text-green-500' : 'text-muted-foreground'}`}>
              {passwordValidation.hasLowerCase ? '✓' : '○'} Uma letra minúscula
            </div>
            <div className={`flex items-center gap-2 text-sm ${passwordValidation.hasNumber ? 'text-green-500' : 'text-muted-foreground'}`}>
              {passwordValidation.hasNumber ? '✓' : '○'} Um número
            </div>
            <div className={`flex items-center gap-2 text-sm ${passwordValidation.hasSpecial ? 'text-green-500' : 'text-muted-foreground'}`}>
              {passwordValidation.hasSpecial ? '✓' : '○'} Um caractere especial (recomendado)
            </div>
          </div>
        </div>

        {/* Security Tips */}
        <div className="dashboard-card md:col-span-2">
          <h3 className="font-semibold text-foreground mb-4">Dicas de Segurança</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              Nunca compartilhe sua senha com outras pessoas
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              Use uma senha diferente para cada serviço
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              Evite usar informações pessoais como datas de aniversário
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              Considere usar um gerenciador de senhas
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
