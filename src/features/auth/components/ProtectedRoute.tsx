import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

// Mock: always allows access (no real auth check)
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  return <>{children}</>;
}