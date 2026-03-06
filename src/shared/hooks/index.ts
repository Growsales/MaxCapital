/**
 * Shared Hooks - Common hooks used across features
 */

// Auth hooks
export * from './useAuth';

// Toast hooks
export * from './use-toast';

// Mobile detection
export * from './use-mobile';

// Re-export from old location for backwards compatibility
export { useProfileComplete } from '@/hooks/useProfileComplete';
export { useProfileDetails } from '@/hooks/useProfileDetails';
export { useProfiles } from '@/hooks/useProfiles';
export { useFormWizardContext } from '@/hooks/useFormWizard';
export { useFormDraft } from '@/hooks/useFormDraft';
