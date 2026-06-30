'use client';

import React, { useEffect } from 'react';
import { usePreferenceStore } from '../stores/preference-store';

export function ThemeProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { theme } = usePreferenceStore((state) => state.preferences);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
      root.style.colorScheme = systemTheme;
    } else {
      root.classList.add(theme);
      root.style.colorScheme = theme;
    }
  }, [theme]);

  return <>{children}</>;
}
export default ThemeProvider;
