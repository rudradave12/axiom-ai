'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../stores/auth-store';
import { SplashSequence } from '../components/splash-sequence';

const PUBLIC_ROUTES = ['/login', '/splash'];

export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { initialized, loading, user, initializeAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  
  // Track whether the splash screen was already displayed in the current tab session
  const [hasSplashed, setHasSplashed] = useState(false);
  const [runningSplash, setRunningSplash] = useState(false);

  // Run initialization on mount
  useEffect(() => {
    const unsubscribe = initializeAuth();
    return (): void => {
      unsubscribe();
    };
  }, [initializeAuth]);

  // Protected route guard validations & Splash trigger
  useEffect(() => {
    if (!initialized) return;

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    if (!user && !isPublicRoute) {
      router.push('/login');
    } else if (user && isPublicRoute) {
      router.push('/');
    }

    // Trigger splash sequence once on initial auth success
    if (user && !hasSplashed && !runningSplash) {
      setRunningSplash(true);
    }
  }, [user, initialized, pathname, router, hasSplashed, runningSplash]);

  const handleSplashComplete = (): void => {
    setHasSplashed(true);
    setRunningSplash(false);
  };

  // 1. Initial loading state (prior to initialization)
  if (!initialized || (loading && !user)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#09090b', color: '#f8fafc' }}>
        <h2 style={{ color: '#3b82f6', fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.025em' }}>AXIOM</h2>
        <div style={{ width: '32px', height: '32px', border: '3px solid #27272a', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // 2. Active loading story splash
  if (runningSplash) {
    return <SplashSequence onComplete={handleSplashComplete} />;
  }

  return <>{children}</>;
}
export default AuthProvider;
