import './globals.css';
import React from 'react';
import { QueryProvider } from '@/shared/providers/query-provider';
import { AuthProvider } from '@/shared/providers/auth-provider';
import { ThemeProvider } from '@/shared/providers/theme-provider';
import { CommandPalette } from '@/shared/components/command-palette';

export const metadata = {
  title: 'AXIOM - AI Workflow Automation Platform',
  description: 'AXIOM turns a single goal into a living mission that executes itself.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider>
              <CommandPalette />
              {children}
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
