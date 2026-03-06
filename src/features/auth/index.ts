/**
 * Auth Feature - Public API
 */
export { ProtectedRoute } from './components/ProtectedRoute';
export { ReferralCodeCapture } from './components/ReferralCodeCapture';

export { default as LoginPage } from './pages/LoginPage';
export { default as RegisterPage } from './pages/RegisterPage';
export { default as CompleteProfilePage } from './pages/CompleteProfilePage';
export { default as ProfileSelectionPage } from './pages/ProfileSelectionPage';

export { useAuth } from './api/useAuth';

export type { UserType, Tables } from '@/types/supabase';
