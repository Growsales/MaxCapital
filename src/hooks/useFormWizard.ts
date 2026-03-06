import { useContext } from 'react';
import { FormContext } from '@/components/forms/FormContext';

/**
 * Hook para acessar o contexto do FormWizard dentro de componentes filhos
 */
export function useFormWizardContext() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormWizardContext must be used within FormWizard');
  }
  return context;
}
