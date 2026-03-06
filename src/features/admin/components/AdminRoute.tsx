import { ReactNode } from 'react';

interface AdminRouteProps {
  children: ReactNode;
  requiredRole?: 'master' | 'administrador' | 'suporte';
}

// Mock: always allows access (no real admin check)
export function AdminRoute({ children }: AdminRouteProps) {
  return <>{children}</>;
}