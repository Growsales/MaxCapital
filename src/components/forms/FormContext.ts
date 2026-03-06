import { createContext } from 'react';
import { FormContextValue } from '@/lib/forms/types';

/**
 * Context do FormWizard - exportado separadamente para evitar issue de fast refresh
 */
export const FormContext = createContext<FormContextValue | undefined>(undefined);
FormContext.displayName = 'FormContext';
