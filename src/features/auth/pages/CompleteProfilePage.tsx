import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, User, MapPin, CheckCircle, ChevronRight, ChevronLeft, Sparkles, DollarSign, ShieldCheck, Info } from 'lucide-react';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { Label } from '@/shared/components/label';
import { useToast } from '@/shared/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { validateCPF, validateAge, formatCPF, formatCNPJ, formatPhone, formatCEP, formatDate, parseFormattedDate } from '@/lib/validators';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface RegistrationData {
  nome: string;
  email: string;
  senha: string;
  tipo: string;
  codigoIndicacao: string | null;
}

const BASE_STEPS = [
  { id: 'personal', title: 'Dados Pessoais', icon: User },
  { id: 'address', title: 'Endereço', icon: MapPin },
];

const INVESTOR_STEPS = [
  { id: 'financials', title: 'Informações Financeiras', icon: DollarSign },
  { id: 'investor_type', title: 'Perfil Investidor', icon: ShieldCheck },
];

const CONFIRMATION_STEP = { id: 'confirmation', title: 'Confirmação', icon: CheckCircle };

function formatCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parseCurrencyToNumber(value: string): number {
  if (!value) return 0;
  const clean = value.replace(/[R$\s.]/g, '').replace(',', '.');
  return parseFloat(clean) || 0;
}

export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [formData, setFormData] = useState({
    tipo_pessoa: '' as 'fisica' | 'juridica' | '',
    nome: '',
    sobrenome: '',
    telefone: '',
    cpf: '',
    cnpj: '',
    categoria_empresa: '',
    razao_social: '',
    data_nascimento: '',
    data_nascimento_display: '',
    endereco_cep: '',
    endereco_logradouro: '',
    endereco_numero: '',
    endereco_complemento: '',
    endereco_bairro: '',
    endereco_cidade: '',
    endereco_uf: '',
    // Investor-specific fields
    receita_bruta_anual: '',
    patrimonio_liquido: '',
    valor_investimentos: '',
    investidor_profissional: '', // 'sim' | 'nao'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isInvestidor = registrationData?.tipo === 'investidor';

  const steps = useMemo(() => {
    const allSteps = [
      ...BASE_STEPS,
      ...(isInvestidor ? INVESTOR_STEPS : []),
      CONFIRMATION_STEP,
    ];
    return allSteps.map((s, i) => ({ ...s, stepNumber: i + 1 }));
  }, [isInvestidor]);

  const totalSteps = steps.length;
  const currentStepData = steps[currentStep - 1];
  const isLastStep = currentStep === totalSteps;

  // Carregar dados da etapa anterior (RegisterPage)
  useEffect(() => {
    const savedData = sessionStorage.getItem('registration_data');
    if (!savedData) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Dados de cadastro não encontrados. Refaça o cadastro.',
      });
      navigate('/cadastro');
      return;
    }
    
    const parsed: RegistrationData = JSON.parse(savedData);
    setRegistrationData(parsed);
    
    if (parsed.nome) {
      const nameParts = parsed.nome.split(' ');
      setFormData(prev => ({
        ...prev,
        nome: nameParts[0] || '',
        sobrenome: nameParts.slice(1).join(' ') || '',
      }));
    }
    
    setIsInitializing(false);
  }, [navigate, toast]);

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

  const handleDateChange = (value: string) => {
    const formatted = formatDate(value);
    const isoDate = parseFormattedDate(formatted);
    setFormData(prev => ({
      ...prev,
      data_nascimento_display: formatted,
      data_nascimento: isoDate,
    }));
  };

  const validatePersonal = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.tipo_pessoa) newErrors.tipo_pessoa = 'Selecione o tipo de pessoa';
    if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!formData.sobrenome.trim()) newErrors.sobrenome = 'Sobrenome é obrigatório';
    if (!formData.telefone.trim() || formData.telefone.replace(/\D/g, '').length < 10) {
      newErrors.telefone = 'Telefone válido é obrigatório';
    }
    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
    } else if (!validateCPF(formData.cpf)) {
      newErrors.cpf = 'CPF inválido';
    }
    if (formData.tipo_pessoa === 'juridica') {
      if (!formData.cnpj.trim() || formData.cnpj.replace(/\D/g, '').length !== 14) {
        newErrors.cnpj = 'CNPJ válido é obrigatório';
      }
      if (!formData.razao_social.trim()) {
        newErrors.razao_social = 'Razão Social é obrigatória';
      }
    }
    if (!formData.data_nascimento) {
      newErrors.data_nascimento = 'Data de nascimento é obrigatória';
    } else if (!validateAge(formData.data_nascimento, 18)) {
      newErrors.data_nascimento = 'Você precisa ter pelo menos 18 anos';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAddress = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.endereco_cep.trim() || formData.endereco_cep.replace(/\D/g, '').length !== 8) {
      newErrors.endereco_cep = 'CEP válido é obrigatório';
    }
    if (!formData.endereco_logradouro.trim()) newErrors.endereco_logradouro = 'Rua é obrigatória';
    if (!formData.endereco_numero.trim()) newErrors.endereco_numero = 'Número é obrigatório';
    if (!formData.endereco_bairro.trim()) newErrors.endereco_bairro = 'Bairro é obrigatório';
    if (!formData.endereco_cidade.trim()) newErrors.endereco_cidade = 'Cidade é obrigatória';
    if (!formData.endereco_uf.trim() || formData.endereco_uf.length !== 2) {
      newErrors.endereco_uf = 'UF válida é obrigatória';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateFinancials = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.receita_bruta_anual) newErrors.receita_bruta_anual = 'Receita bruta anual é obrigatória';
    if (!formData.patrimonio_liquido) newErrors.patrimonio_liquido = 'Patrimônio líquido é obrigatório';
    if (!formData.valor_investimentos) newErrors.valor_investimentos = 'Valor total em investimentos é obrigatório';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateInvestorType = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.investidor_profissional) newErrors.investidor_profissional = 'Selecione uma opção';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCurrentStep = (): boolean => {
    const stepId = currentStepData?.id;
    switch (stepId) {
      case 'personal': return validatePersonal();
      case 'address': return validateAddress();
      case 'financials': return validateFinancials();
      case 'investor_type': return validateInvestorType();
      case 'confirmation': return true;
      default: return true;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep() && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      setErrors({});
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    if (!registrationData) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Dados de registro não encontrados.' });
      return;
    }

    setIsLoading(true);

    try {
      // 1️⃣ CRIAR USUÁRIO NO SUPABASE AUTH
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registrationData.email,
        password: registrationData.senha,
        options: {
          data: {
            nome: `${formData.nome} ${formData.sobrenome}`.trim(),
            tipo: registrationData.tipo,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erro ao criar usuário');

      // 2️⃣ ATUALIZAR PROFILE
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nome: `${formData.nome} ${formData.sobrenome}`.trim(),
          telefone: formData.telefone,
          tipo: registrationData.tipo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      // 3️⃣ CRIAR PROFILE_DETAILS
      const detailsPayload: Record<string, any> = {
        user_id: authData.user.id,
        tipo_pessoa: formData.tipo_pessoa,
        cpf: formData.cpf,
        cnpj: formData.tipo_pessoa === 'juridica' ? formData.cnpj : null,
        razao_social: formData.tipo_pessoa === 'juridica' ? formData.razao_social : null,
        data_nascimento: formData.data_nascimento,
        endereco_cep: formData.endereco_cep,
        endereco_logradouro: formData.endereco_logradouro,
        endereco_numero: formData.endereco_numero,
        endereco_complemento: formData.endereco_complemento || null,
        endereco_bairro: formData.endereco_bairro,
        endereco_cidade: formData.endereco_cidade,
        endereco_uf: formData.endereco_uf,
        codigo_indicacao: registrationData.codigoIndicacao || null,
      };

      // Add investor-specific data
      if (isInvestidor) {
        detailsPayload.receita_bruta_anual = parseCurrencyToNumber(formData.receita_bruta_anual);
        detailsPayload.patrimonio_liquido = parseCurrencyToNumber(formData.patrimonio_liquido);
        detailsPayload.valor_investimentos = parseCurrencyToNumber(formData.valor_investimentos);
        detailsPayload.investidor_profissional = formData.investidor_profissional === 'sim';
      }

      const { error: detailsError } = await supabase
        .from('profile_details')
        .upsert(detailsPayload, { onConflict: 'user_id' });

      if (detailsError) throw detailsError;

      // 4️⃣ PROCESSAR CÓDIGO DE INDICAÇÃO
      const codigoIndicacao = registrationData.codigoIndicacao || localStorage.getItem('pending_referral_code');
      if (codigoIndicacao) {
        try {
          const { data: functionData, error: functionError } = await supabase.functions.invoke('process-referral', {
            body: {
              codigo_convite: codigoIndicacao.toUpperCase(),
              novo_usuario_id: authData.user.id,
            }
          });

          if (functionError) {
            console.error('❌ Erro ao processar indicação:', functionError);
          } else {
            localStorage.removeItem('pending_referral_code');
            if (functionData?.success) {
              toast({ title: 'Indicação confirmada!', description: `Código ${codigoIndicacao} aplicado com sucesso.` });
            }
          }
        } catch (err) {
          console.error('💥 Erro inesperado ao processar indicação:', err);
        }
      }

      // 5️⃣ LIMPAR SESSÃO
      sessionStorage.removeItem('registration_data');

      toast({ title: 'Cadastro completo!', description: 'Bem-vindo à MAX CAPITAL!' });
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      console.error('❌ Erro no cadastro:', error);
      toast({
        variant: 'destructive',
        title: 'Erro no cadastro',
        description: error.message || 'Não foi possível completar o cadastro.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const profileLabels: Record<string, string> = {
    parceiro: 'Parceiro',
    empresa: 'Empresa',
    investidor: 'Investidor',
    admin: 'Admin',
    master: 'Master',
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // ─── Step Renders ───
  const renderPersonalStep = () => (
    <motion.div key="personal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg"><User className="h-5 w-5 text-primary" /></div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Dados Pessoais</h2>
          <p className="text-sm text-muted-foreground">Informações básicas sobre você</p>
        </div>
      </div>
      <div className="space-y-4">
        <div className="space-y-3">
          <Label>Tipo de Pessoa *</Label>
          <RadioGroup
            value={formData.tipo_pessoa}
            onValueChange={(val) => setFormData(prev => ({ ...prev, tipo_pessoa: val as 'fisica' | 'juridica' }))}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fisica" id="pf" />
              <Label htmlFor="pf" className="cursor-pointer font-normal">Pessoa Física</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="juridica" id="pj" />
              <Label htmlFor="pj" className="cursor-pointer font-normal">Pessoa Jurídica</Label>
            </div>
          </RadioGroup>
          {errors.tipo_pessoa && <p className="text-xs text-destructive">{errors.tipo_pessoa}</p>}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input id="nome" value={formData.nome} onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))} placeholder="Seu nome" className={`h-11 ${errors.nome ? 'border-destructive focus-visible:ring-destructive' : ''}`} />
          {errors.nome && <p className="text-xs text-destructive">{errors.nome}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="sobrenome">Sobrenome *</Label>
          <Input id="sobrenome" value={formData.sobrenome} onChange={(e) => setFormData(prev => ({ ...prev, sobrenome: e.target.value }))} placeholder="Seu sobrenome" className={`h-11 ${errors.sobrenome ? 'border-destructive focus-visible:ring-destructive' : ''}`} />
          {errors.sobrenome && <p className="text-xs text-destructive">{errors.sobrenome}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="cpf">CPF *</Label>
          <Input id="cpf" value={formData.cpf} onChange={(e) => setFormData(prev => ({ ...prev, cpf: formatCPF(e.target.value) }))} placeholder="000.000.000-00" className={`h-11 ${errors.cpf ? 'border-destructive focus-visible:ring-destructive' : ''}`} />
          {errors.cpf && <p className="text-xs text-destructive">{errors.cpf}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="data_nascimento">Data de Nascimento *</Label>
          <Input id="data_nascimento" value={formData.data_nascimento_display} onChange={(e) => handleDateChange(e.target.value)} placeholder="DD/MM/AAAA" maxLength={10} className={`h-11 ${errors.data_nascimento ? 'border-destructive focus-visible:ring-destructive' : ''}`} />
          {errors.data_nascimento && <p className="text-xs text-destructive">{errors.data_nascimento}</p>}
        </div>
        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="telefone">Telefone *</Label>
          <Input id="telefone" value={formData.telefone} onChange={(e) => setFormData(prev => ({ ...prev, telefone: formatPhone(e.target.value) }))} placeholder="(00) 00000-0000" className={`h-11 ${errors.telefone ? 'border-destructive focus-visible:ring-destructive' : ''}`} />
          {errors.telefone && <p className="text-xs text-destructive">{errors.telefone}</p>}
        </div>
        {formData.tipo_pessoa === 'juridica' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input id="cnpj" value={formData.cnpj} onChange={(e) => setFormData(prev => ({ ...prev, cnpj: formatCNPJ(e.target.value) }))} placeholder="00.000.000/0000-00" className={`h-11 ${errors.cnpj ? 'border-destructive focus-visible:ring-destructive' : ''}`} />
              {errors.cnpj && <p className="text-xs text-destructive">{errors.cnpj}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria_empresa">Categoria *</Label>
              <select
                id="categoria_empresa"
                value={formData.categoria_empresa}
                onChange={(e) => setFormData(prev => ({ ...prev, categoria_empresa: e.target.value }))}
                className={`flex h-11 w-full rounded-md bg-muted/50 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.categoria_empresa ? 'border-destructive focus:ring-destructive' : ''}`}
              >
                <option value="">Selecione a categoria</option>
                {[
                  'Administração de Carteiras', 'Administração de Recursos', 'Agente Autônomo',
                  'Banco Comercial', 'Banco de Investimento', 'Boutique de Investimentos',
                  'Corretoras', 'Family Office', 'Fintech', 'Firmas de Consultoria',
                  'Formação de Mercado', 'Fundo de Hedge', 'Fundos de Pensão', 'Fundos Mútuos',
                  'Fundos Patrimoniais', 'Fundos Soberanos', 'Gestão de Ativos', 'Gestão de Recursos',
                  'Instituição Financeira', 'Outro/Não especificado', 'Pesquisa de Ações',
                  'Private Equity', 'Securitização', 'Seguros', 'Vendas e Negociação', 'Venture Capital',
                ].map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.categoria_empresa && <p className="text-xs text-destructive">{errors.categoria_empresa}</p>}
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="razao_social">Razão Social *</Label>
              <Input id="razao_social" value={formData.razao_social} onChange={(e) => setFormData(prev => ({ ...prev, razao_social: e.target.value }))} placeholder="Razão Social da empresa" className={`h-11 ${errors.razao_social ? 'border-destructive focus-visible:ring-destructive' : ''}`} />
              {errors.razao_social && <p className="text-xs text-destructive">{errors.razao_social}</p>}
            </div>
          </>
        )}
      </div>
      </div>
    </motion.div>
  );

  const renderAddressStep = () => (
    <motion.div key="address" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg"><MapPin className="h-5 w-5 text-primary" /></div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {formData.tipo_pessoa === 'juridica' ? 'Endereço da Empresa' : 'Endereço'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {formData.tipo_pessoa === 'juridica' ? 'Endereço comercial da empresa' : 'Onde você mora'}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="col-span-1 space-y-2">
          <Label htmlFor="cep">CEP *</Label>
          <Input id="cep" value={formData.endereco_cep} onChange={(e) => setFormData(prev => ({ ...prev, endereco_cep: formatCEP(e.target.value) }))} onBlur={handleCepBlur} placeholder="00000-000" className={`h-11 ${errors.endereco_cep ? 'border-destructive' : ''}`} />
          {errors.endereco_cep && <p className="text-xs text-destructive">{errors.endereco_cep}</p>}
        </div>
        <div className="col-span-1 sm:col-span-2 space-y-2">
          <Label htmlFor="logradouro">Rua *</Label>
          <Input id="logradouro" value={formData.endereco_logradouro} onChange={(e) => setFormData(prev => ({ ...prev, endereco_logradouro: e.target.value }))} placeholder="Nome da rua" className={`h-11 ${errors.endereco_logradouro ? 'border-destructive' : ''}`} />
          {errors.endereco_logradouro && <p className="text-xs text-destructive">{errors.endereco_logradouro}</p>}
        </div>
        <div className="col-span-1 space-y-2">
          <Label htmlFor="numero">Número *</Label>
          <Input id="numero" value={formData.endereco_numero} onChange={(e) => setFormData(prev => ({ ...prev, endereco_numero: e.target.value }))} placeholder="000" className={`h-11 ${errors.endereco_numero ? 'border-destructive' : ''}`} />
          {errors.endereco_numero && <p className="text-xs text-destructive">{errors.endereco_numero}</p>}
        </div>
        <div className="col-span-2 space-y-2">
          <Label htmlFor="complemento">Complemento</Label>
          <Input id="complemento" value={formData.endereco_complemento} onChange={(e) => setFormData(prev => ({ ...prev, endereco_complemento: e.target.value }))} placeholder="Apto, sala..." className="h-11" />
        </div>
        <div className="col-span-2 space-y-2">
          <Label htmlFor="bairro">Bairro *</Label>
          <Input id="bairro" value={formData.endereco_bairro} onChange={(e) => setFormData(prev => ({ ...prev, endereco_bairro: e.target.value }))} placeholder="Bairro" className={`h-11 ${errors.endereco_bairro ? 'border-destructive' : ''}`} />
          {errors.endereco_bairro && <p className="text-xs text-destructive">{errors.endereco_bairro}</p>}
        </div>
        <div className="col-span-2 sm:col-span-1 space-y-2">
          <Label htmlFor="cidade">Cidade *</Label>
          <Input id="cidade" value={formData.endereco_cidade} onChange={(e) => setFormData(prev => ({ ...prev, endereco_cidade: e.target.value }))} placeholder="Cidade" className={`h-11 ${errors.endereco_cidade ? 'border-destructive' : ''}`} />
          {errors.endereco_cidade && <p className="text-xs text-destructive">{errors.endereco_cidade}</p>}
        </div>
        <div className="col-span-2 sm:col-span-1 space-y-2">
          <Label htmlFor="uf">UF *</Label>
          <Input id="uf" value={formData.endereco_uf} onChange={(e) => setFormData(prev => ({ ...prev, endereco_uf: e.target.value.toUpperCase().slice(0, 2) }))} placeholder="UF" maxLength={2} className={`h-11 ${errors.endereco_uf ? 'border-destructive' : ''}`} />
          {errors.endereco_uf && <p className="text-xs text-destructive">{errors.endereco_uf}</p>}
        </div>
      </div>
    </motion.div>
  );

  const renderFinancialsStep = () => (
    <motion.div key="financials" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg"><DollarSign className="h-5 w-5 text-primary" /></div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Informações Financeiras</h2>
          <p className="text-sm text-muted-foreground">Forneça os dados financeiros necessários para análise de estrutura e elegibilidade.</p>
        </div>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="receita_bruta_anual">Receita bruta anual *</Label>
          <Input
            id="receita_bruta_anual"
            value={formData.receita_bruta_anual}
            onChange={(e) => setFormData(prev => ({ ...prev, receita_bruta_anual: formatCurrencyInput(e.target.value) }))}
            placeholder="R$ 0,00"
            className={`h-11 ${errors.receita_bruta_anual ? 'border-destructive focus-visible:ring-destructive' : ''}`}
          />
          {errors.receita_bruta_anual && <p className="text-xs text-destructive">{errors.receita_bruta_anual}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="patrimonio_liquido">Patrimônio Líquido *</Label>
          <Input
            id="patrimonio_liquido"
            value={formData.patrimonio_liquido}
            onChange={(e) => setFormData(prev => ({ ...prev, patrimonio_liquido: formatCurrencyInput(e.target.value) }))}
            placeholder="R$ 0,00"
            className={`h-11 ${errors.patrimonio_liquido ? 'border-destructive focus-visible:ring-destructive' : ''}`}
          />
          {errors.patrimonio_liquido && <p className="text-xs text-destructive">{errors.patrimonio_liquido}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="valor_investimentos">Valor total em investimentos *</Label>
          <Input
            id="valor_investimentos"
            value={formData.valor_investimentos}
            onChange={(e) => setFormData(prev => ({ ...prev, valor_investimentos: formatCurrencyInput(e.target.value) }))}
            placeholder="R$ 0,00"
            className={`h-11 ${errors.valor_investimentos ? 'border-destructive focus-visible:ring-destructive' : ''}`}
          />
          {errors.valor_investimentos && <p className="text-xs text-destructive">{errors.valor_investimentos}</p>}
        </div>
      </div>
    </motion.div>
  );

  const renderInvestorTypeStep = () => (
    <motion.div key="investor_type" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg"><ShieldCheck className="h-5 w-5 text-primary" /></div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Você é investidor profissional?</h2>
          <p className="text-sm text-muted-foreground">Considera-se investidor profissional se possuir mais de R$ 1 milhão investido em ativos financeiros ou certificação reconhecida no mercado.</p>
        </div>
      </div>

      <RadioGroup
        value={formData.investidor_profissional}
        onValueChange={(value) => setFormData(prev => ({ ...prev, investidor_profissional: value }))}
        className="space-y-3"
      >
        <label
          htmlFor="inv-sim"
          className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
            formData.investidor_profissional === 'sim'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <RadioGroupItem value="sim" id="inv-sim" />
          <span className="font-medium text-foreground">Sou investidor profissional</span>
        </label>
        <label
          htmlFor="inv-nao"
          className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
            formData.investidor_profissional === 'nao'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <RadioGroupItem value="nao" id="inv-nao" />
          <span className="font-medium text-foreground">Não sou investidor profissional</span>
        </label>
      </RadioGroup>

      {errors.investidor_profissional && <p className="text-xs text-destructive">{errors.investidor_profissional}</p>}

      <div className="bg-muted/50 rounded-xl p-4 flex gap-3">
        <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p>Para ser considerado um <strong className="text-foreground">investidor profissional</strong>, você precisa <strong className="text-foreground">atender a pelo menos um dos seguintes requisitos</strong>:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Possuir mais de R$ 1 milhão investido.</li>
            <li>Ter certificação aceita pela CVM.</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );

  const renderConfirmationStep = () => (
    <motion.div key="confirmation" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg"><CheckCircle className="h-5 w-5 text-primary" /></div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Confirme seus dados</h2>
          <p className="text-sm text-muted-foreground">Revise as informações antes de finalizar</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Personal Data Summary */}
        <div className="bg-muted/50 rounded-xl p-4 space-y-3">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Dados Pessoais
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Nome:</span><span className="font-medium text-foreground">{formData.nome} {formData.sobrenome}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">CPF:</span><span className="font-medium text-foreground">{formData.cpf}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Nascimento:</span><span className="font-medium text-foreground">{formData.data_nascimento_display}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Telefone:</span><span className="font-medium text-foreground">{formData.telefone}</span></div>
          </div>
        </div>

        {/* Address Summary */}
        <div className="bg-muted/50 rounded-xl p-4 space-y-3">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Endereço
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">CEP:</span><span className="font-medium text-foreground">{formData.endereco_cep}</span></div>
            <div className="text-foreground">{formData.endereco_logradouro}, {formData.endereco_numero}{formData.endereco_complemento && ` - ${formData.endereco_complemento}`}</div>
            <div className="text-foreground">{formData.endereco_bairro}</div>
            <div className="text-foreground">{formData.endereco_cidade} - {formData.endereco_uf}</div>
          </div>
        </div>

        {/* Investor Financial Summary (only for investidor) */}
        {isInvestidor && (
          <>
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <h3 className="font-medium text-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Informações Financeiras
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Receita bruta:</span><span className="font-medium text-foreground">{formData.receita_bruta_anual}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Patrimônio líquido:</span><span className="font-medium text-foreground">{formData.patrimonio_liquido}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Investimentos:</span><span className="font-medium text-foreground">{formData.valor_investimentos}</span></div>
              </div>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <h3 className="font-medium text-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Perfil Investidor
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Investidor profissional:</span>
                  <span className="font-medium text-foreground">{formData.investidor_profissional === 'sim' ? 'Sim' : 'Não'}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Ao clicar em <strong className="text-primary">Concluir Cadastro</strong>, você confirma que todas as informações estão corretas.
        </p>
      </div>
    </motion.div>
  );

  const renderCurrentStep = () => {
    switch (currentStepData?.id) {
      case 'personal': return renderPersonalStep();
      case 'address': return renderAddressStep();
      case 'financials': return renderFinancialsStep();
      case 'investor_type': return renderInvestorTypeStep();
      case 'confirmation': return renderConfirmationStep();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <motion.div 
        className="w-full max-w-2xl relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div className="inline-flex items-center gap-1 text-2xl mb-6" initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}>
            <span className="font-bold text-foreground">MAX</span>
            <span className="w-px h-6 bg-primary mx-1" />
            <span className="font-medium text-foreground/80">CAPITAL</span>
          </motion.div>
          
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Complete seu cadastro
            </h1>
            <p className="text-muted-foreground">Faltam apenas alguns passos para começar</p>
            {registrationData?.tipo && (
              <p className="text-sm mt-2">
                Perfil: <span className="text-primary font-semibold">{profileLabels[registrationData.tipo] || registrationData.tipo}</span>
              </p>
            )}
          </motion.div>
        </div>

        {/* Stepper */}
        <motion.div className="mb-8" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="flex items-center justify-center">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.stepNumber;
              const isCompleted = currentStep > step.stepNumber;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <motion.div
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                        ${isActive ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110' : ''}
                        ${isCompleted ? 'bg-primary/20 text-primary' : ''}
                        ${!isActive && !isCompleted ? 'bg-muted text-muted-foreground' : ''}
                      `}
                      animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      {isCompleted ? <CheckCircle className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                    </motion.div>
                    <span className={`text-xs mt-2 font-medium transition-colors max-w-[80px] text-center ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                      {step.title}
                    </span>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={`w-10 sm:w-16 h-0.5 mx-1 sm:mx-2 mb-6 transition-colors ${currentStep > step.stepNumber ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Form Card */}
        <motion.div
          className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-8 shadow-xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <AnimatePresence mode="wait">
            {renderCurrentStep()}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border/50">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1 || isLoading}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </Button>

            {!isLastStep ? (
              <Button type="button" onClick={handleNext} className="btn-accent gap-2">
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="btn-accent gap-2 min-w-[180px]"
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Salvando...</>
                ) : (
                  <><CheckCircle className="h-4 w-4" />Concluir Cadastro</>
                )}
              </Button>
            )}
          </div>
        </motion.div>

        {/* Progress indicator */}
        <motion.div className="mt-6 text-center text-sm text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          Passo {currentStep} de {totalSteps}
        </motion.div>
      </motion.div>
    </div>
  );
}
