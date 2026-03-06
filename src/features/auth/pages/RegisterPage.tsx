import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Gift } from 'lucide-react';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { Label } from '@/shared/components/label';
import { useToast } from '@/shared/hooks/use-toast';
import { useConfigImage } from '@/hooks/useConfigImages';
import { motion } from 'framer-motion';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const profileLabels: Record<string, string> = {
  parceiro: 'Parceiro',
  empresa: 'Empresa',
  investidor: 'Investidor',
};

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const authHero = useConfigImage('img_registro_hero');

  const profile = searchParams.get('perfil') || 'parceiro';
  const refCode = searchParams.get('ref') || '';

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    codigoIndicacao: refCode,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    if (refCode && refCode !== formData.codigoIndicacao) {
      setFormData(prev => ({ ...prev, codigoIndicacao: refCode }));
    }
  }, [refCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.senha !== formData.confirmarSenha) {
      toast({ variant: 'destructive', title: 'Erro', description: 'As senhas não coincidem.' });
      return;
    }
    if (formData.senha.length < 6) {
      toast({ variant: 'destructive', title: 'Erro', description: 'A senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    const registrationData = {
      nome: formData.nome,
      email: formData.email,
      senha: formData.senha,
      tipo: profile,
      codigoIndicacao: formData.codigoIndicacao?.toUpperCase() || null,
    };
    sessionStorage.setItem('registration_data', JSON.stringify(registrationData));
    if (formData.codigoIndicacao) {
      localStorage.setItem('pending_referral_code', formData.codigoIndicacao.toUpperCase());
    }
    toast({ title: 'Dados salvos!', description: 'Agora complete seu cadastro.' });
    navigate('/completar-cadastro');
  };

  const handleGoogleSignUp = async () => {
    toast({ variant: 'destructive', title: 'Indisponível', description: 'Cadastro com Google será habilitado em breve.' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 lg:p-8">
      <motion.div
        className="w-full max-w-[1300px] bg-black rounded-3xl overflow-hidden flex min-h-[720px] border border-primary/30 animate-[pulse-glow_3s_ease-in-out_infinite]"
        style={{ animationName: 'pulse-glow' }}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Hero Left Side */}
        <div className="hidden lg:block relative w-[48%] overflow-hidden">
          <img
            src={authHero}
            alt="Hero"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

          <div className="relative z-10 p-8">
            <Link to="/" className="flex items-center gap-1.5 text-lg">
              <span className="font-bold text-white">MAX</span>
              <span className="w-px h-5 bg-primary mx-1" />
              <span className="font-medium text-white/80">CAPITAL</span>
            </Link>
          </div>

          <div className="relative z-10 absolute bottom-0 left-0 right-0 p-8 pb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-white leading-tight mb-2">
              Comece sua jornada no<br />
              Mercado de Capitais.
            </h2>
            <p className="text-sm text-white/60 max-w-sm">
              Crie sua conta e tenha acesso a oportunidades exclusivas.
            </p>
          </div>
        </div>

        {/* Right Form */}
        <div className="flex-1 flex flex-col justify-center px-8 py-10 lg:px-14 lg:py-8 overflow-y-auto bg-black">
          <div className="hidden lg:flex justify-end mb-6">
            <Link
              to="/login"
              className="px-5 py-2 rounded-full border border-white/15 text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              Fazer login
            </Link>
          </div>

          <div className="lg:hidden mb-6 text-center">
            <Link to="/" className="inline-flex items-center gap-1.5 text-lg">
              <span className="font-bold text-white">MAX</span>
              <span className="w-px h-5 bg-primary mx-1" />
              <span className="font-medium text-white/70">CAPITAL</span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">Crie sua conta</h1>
          <p className="text-white/50 text-sm mb-2">Preencha seus dados para começar.</p>

          <p className="text-sm mb-5 text-white/70">
            Perfil: <span className="text-primary font-medium">{profileLabels[profile]}</span>
            <Link to="/selecao-perfil" className="text-white/40 hover:text-primary ml-2 text-xs">(alterar)</Link>
          </p>

          {refCode && (
            <div className="mb-5 p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
              <Gift className="h-5 w-5 text-primary shrink-0" />
              <div className="text-sm">
                <span className="text-white/50">Indicado! Código: </span>
                <span className="font-mono font-medium text-primary">{refCode}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome" className="text-sm font-medium text-white/70">Nome completo</Label>
              <Input id="nome" type="text" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} placeholder="Seu nome completo" className="h-11 rounded-xl border-white/15 bg-white/5 text-white placeholder:text-white/30" required disabled={isLoading || isGoogleLoading} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-white/70">E-mail</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Seu e-mail" className="h-11 rounded-xl border-white/15 bg-white/5 text-white placeholder:text-white/30" required disabled={isLoading || isGoogleLoading} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="senha" className="text-sm font-medium text-white/70">Senha</Label>
              <div className="relative">
                <Input id="senha" type={showPassword ? 'text' : 'password'} value={formData.senha} onChange={(e) => setFormData({ ...formData, senha: e.target.value })} placeholder="Mínimo 6 caracteres" className="h-11 rounded-xl pr-10 border-white/15 bg-white/5 text-white placeholder:text-white/30" required disabled={isLoading || isGoogleLoading} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmarSenha" className="text-sm font-medium text-white/70">Confirmar senha</Label>
              <div className="relative">
                <Input id="confirmarSenha" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmarSenha} onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })} placeholder="Confirme sua senha" className="h-11 rounded-xl pr-10 border-white/15 bg-white/5 text-white placeholder:text-white/30" required disabled={isLoading || isGoogleLoading} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="codigoIndicacao" className="text-sm font-medium text-white/70 flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                Código de indicação <span className="text-white/30 text-xs">(opcional)</span>
              </Label>
              <Input id="codigoIndicacao" type="text" value={formData.codigoIndicacao} onChange={(e) => setFormData({ ...formData, codigoIndicacao: e.target.value.toUpperCase() })} placeholder="Ex: ABC12345" className="h-11 rounded-xl font-mono uppercase tracking-wider border-white/15 bg-white/5 text-white placeholder:text-white/30" maxLength={8} disabled={isLoading || isGoogleLoading} />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold rounded-xl bg-white text-black hover:bg-white/90 mt-1"
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Cadastrar'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-black px-3 text-white/40">Cadastro instantâneo</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignUp}
            disabled={isGoogleLoading || isLoading}
            className="w-full h-11 rounded-xl text-sm font-medium gap-3 border-white/15 bg-white/5 text-white hover:bg-white/10"
          >
            {isGoogleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><GoogleIcon /> Continuar com Google</>}
          </Button>

          <p className="text-center mt-6 text-sm text-white/50">
            Já possui conta?{' '}
            <Link to="/login" className="text-primary hover:text-primary/80 font-semibold transition-colors">
              Faça login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
