import { useState, useEffect } from 'react';
import { CreditCard, Wallet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/types/supabase';
import type { ProfileDetails } from './PersonalInfoTab';

interface BankingInfoTabProps {
  profile: Tables<'profiles'> | null;
  profileDetails: ProfileDetails | null;
  onUpdate: () => void;
}

const BANCOS = [
  { codigo: '001', nome: 'Banco do Brasil' },
  { codigo: '033', nome: 'Santander' },
  { codigo: '104', nome: 'Caixa Econômica Federal' },
  { codigo: '237', nome: 'Bradesco' },
  { codigo: '341', nome: 'Itaú Unibanco' },
  { codigo: '260', nome: 'Nubank' },
  { codigo: '077', nome: 'Inter' },
  { codigo: '336', nome: 'C6 Bank' },
  { codigo: '212', nome: 'Banco Original' },
  { codigo: '756', nome: 'Sicoob' },
  { codigo: '748', nome: 'Sicredi' },
  { codigo: '422', nome: 'Safra' },
  { codigo: '070', nome: 'BRB' },
  { codigo: '085', nome: 'Via Credi' },
];

const PIX_TIPOS = [
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'email', label: 'E-mail' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'aleatoria', label: 'Chave Aleatória' },
];

export default function BankingInfoTab({ profile, profileDetails, onUpdate }: BankingInfoTabProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    banco_nome: '',
    banco_agencia: '',
    banco_conta: '',
    banco_tipo_conta: '',
    pix_tipo: '',
    pix_chave: '',
  });

  useEffect(() => {
    if (profileDetails) {
      setFormData({
        banco_nome: profileDetails.banco_nome || '',
        banco_agencia: profileDetails.banco_agencia || '',
        banco_conta: profileDetails.banco_conta || '',
        banco_tipo_conta: profileDetails.banco_tipo_conta || '',
        pix_tipo: profileDetails.pix_tipo || '',
        pix_chave: profileDetails.pix_chave || '',
      });
    }
  }, [profileDetails]);

  const formatAgencia = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 5);
  };

  const formatConta = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 12);
    if (numbers.length <= 1) return numbers;
    return `${numbers.slice(0, -1)}-${numbers.slice(-1)}`;
  };

  const handleSave = async () => {
    if (!profile?.id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profile_details')
        .upsert({
          user_id: profile.id,
          banco_nome: formData.banco_nome || null,
          banco_agencia: formData.banco_agencia || null,
          banco_conta: formData.banco_conta || null,
          banco_tipo_conta: formData.banco_tipo_conta || null,
          pix_tipo: formData.pix_tipo || null,
          pix_chave: formData.pix_chave || null,
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      toast({
        title: 'Dados bancários atualizados',
        description: 'Suas informações bancárias foram salvas com sucesso.',
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
        {/* Bank Account */}
        <div className="dashboard-card">
          <div className="flex items-center gap-2 mb-6">
            <CreditCard className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Conta Bancária</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Banco</Label>
              <Select
                value={formData.banco_nome}
                onValueChange={(value) => setFormData(prev => ({ ...prev, banco_nome: value }))}
              >
                <SelectTrigger className="form-input">
                  <SelectValue placeholder="Selecione o banco" />
                </SelectTrigger>
                <SelectContent>
                  {BANCOS.map((banco) => (
                    <SelectItem key={banco.codigo} value={banco.nome}>
                      {banco.codigo} - {banco.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Agência</Label>
                <Input 
                  value={formData.banco_agencia}
                  onChange={(e) => setFormData(prev => ({ ...prev, banco_agencia: formatAgencia(e.target.value) }))}
                  placeholder="0000"
                  className="form-input" 
                />
              </div>
              <div className="space-y-2">
                <Label>Conta</Label>
                <Input 
                  value={formData.banco_conta}
                  onChange={(e) => setFormData(prev => ({ ...prev, banco_conta: formatConta(e.target.value) }))}
                  placeholder="00000000-0"
                  className="form-input" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Conta</Label>
              <Select
                value={formData.banco_tipo_conta}
                onValueChange={(value) => setFormData(prev => ({ ...prev, banco_tipo_conta: value }))}
              >
                <SelectTrigger className="form-input">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corrente">Conta Corrente</SelectItem>
                  <SelectItem value="poupanca">Conta Poupança</SelectItem>
                  <SelectItem value="pagamento">Conta de Pagamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* PIX */}
        <div className="dashboard-card">
          <div className="flex items-center gap-2 mb-6">
            <Wallet className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Chave PIX</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Chave</Label>
              <Select
                value={formData.pix_tipo}
                onValueChange={(value) => setFormData(prev => ({ ...prev, pix_tipo: value }))}
              >
                <SelectTrigger className="form-input">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {PIX_TIPOS.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Chave PIX</Label>
              <Input 
                value={formData.pix_chave}
                onChange={(e) => setFormData(prev => ({ ...prev, pix_chave: e.target.value }))}
                placeholder={
                  formData.pix_tipo === 'cpf' ? '000.000.000-00' :
                  formData.pix_tipo === 'cnpj' ? '00.000.000/0000-00' :
                  formData.pix_tipo === 'email' ? 'seu@email.com' :
                  formData.pix_tipo === 'telefone' ? '+55 00 00000-0000' :
                  'Sua chave PIX'
                }
                className="form-input" 
              />
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="dashboard-card md:col-span-2">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
            <svg className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <h4 className="font-medium text-foreground">Seus dados estão seguros</h4>
              <p className="text-sm text-muted-foreground mt-1">
                As informações bancárias são armazenadas de forma criptografada e são utilizadas apenas 
                para fins de pagamento de comissões e repasses. Nunca compartilhamos seus dados com terceiros.
              </p>
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
