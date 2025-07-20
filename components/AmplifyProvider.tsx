'use client';

import { useEffect } from 'react';
import { configureAmplify } from '@/lib/amplify';

interface AmplifyProviderProps {
  children: React.ReactNode;
}

export function AmplifyProvider({ children }: AmplifyProviderProps) {
  useEffect(() => {
    configureAmplify();
  }, []);

  return <>{children}</>;
}