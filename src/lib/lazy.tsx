import { Suspense, ComponentType, lazy, ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyComponentProps {
  fallback?: ReactNode;
}

/**
 * Wraps a lazy-loaded component with Suspense and a loading fallback
 */
export const withLazyBoundary = <P extends object>(
  Component: ComponentType<P>,
  fallback?: ReactNode
) => {
  return (props: P) => (
    <Suspense fallback={fallback || <LoadingFallback />}>
      <Component {...props} />
    </Suspense>
  );
};

/**
 * Default loading fallback component
 */
export const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="space-y-4 w-full max-w-md px-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  </div>
);

/**
 * Lazy load a component with Suspense wrapper
 */
export const lazyComponent = <P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  fallback?: ReactNode
) => {
  const Component = lazy(importFunc);
  return withLazyBoundary(Component, fallback);
};
