'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMissionStore } from '../stores/mission-store';
import { useAuthStore } from '../stores/auth-store';
import { usePreferenceStore } from '../stores/preference-store';

export function CommandPalette(): React.JSX.Element | null {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const { missions } = useMissionStore();
  const { signOut } = useAuthStore();
  const { preferences, updatePreferences } = usePreferenceStore();
  
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Toggle Command Palette on Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return (): void => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset indices and focus on open
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Build command list dynamically
  const coreCommands = [
    { id: 'dashboard', title: 'Go to Command Center Dashboard', shortcut: '↵', action: (): void => { router.push('/'); setIsOpen(false); } },
    { id: 'create', title: 'Create New Mission Track...', shortcut: 'N', action: (): void => { router.push('/mission/create'); setIsOpen(false); } },
    { id: 'settings', title: 'Open Settings Panel', shortcut: 'S', action: (): void => { router.push('/profile'); setIsOpen(false); } },
    { id: 'theme', title: `Switch Theme Mode (Current: ${preferences.theme.toUpperCase()})`, shortcut: 'T', action: (): void => {
      const nextTheme = preferences.theme === 'dark' ? 'light' : 'dark';
      updatePreferences({ theme: nextTheme }).catch(() => {});
      setIsOpen(false);
    } },
    { id: 'logout', title: 'Sign Out Session', shortcut: 'Q', action: (): void => { signOut().catch(() => {}); setIsOpen(false); } },
  ];

  // Map missions list to search results
  const missionCommands = missions.map((m) => ({
    id: `mission-${m.id}`,
    title: `Open Mission: ${m.title}`,
    shortcut: 'M',
    action: (): void => { router.push(`/mission/${m.id}`); setIsOpen(false); }
  }));

  const allCommands = [...coreCommands, ...missionCommands];

  const filteredCommands = allCommands.filter((cmd) =>
    cmd.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    }
  };

  return (
    <div style={styles.overlay} onClick={() => setIsOpen(false)}>
      <div style={styles.dialog} onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        {/* Search Bar Input */}
        <div style={styles.searchHeader}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search commands or active missions..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            style={styles.searchInput}
          />
          <span style={styles.escBadge}>ESC</span>
        </div>

        {/* Command List container */}
        <div style={styles.list}>
          {filteredCommands.length === 0 ? (
            <div style={styles.emptyState}>No matching execution tracks or actions.</div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={isSelected ? styles.itemActive : styles.item}
                >
                  <div style={styles.itemTitleRow}>
                    <span style={styles.itemBullet}>{isSelected ? '▶' : '•'}</span>
                    <span>{cmd.title}</span>
                  </div>
                  <kbd style={styles.itemShortcut}>{cmd.shortcut}</kbd>
                </div>
              );
            })
          )}
        </div>

        {/* Console status footer */}
        <div style={styles.footer}>
          <span>Use ↑↓ keys to select, enter to execute, click to select.</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(9, 9, 11, 0.65)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '15vh',
    zIndex: 99999,
  } as React.CSSProperties,
  dialog: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: '540px',
    backgroundColor: 'var(--sys-bg-surface)',
    border: '1px solid var(--sys-border-strong)',
    borderRadius: '12px',
    boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.4)',
    overflow: 'hidden',
    animation: 'cmd-open 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  } as React.CSSProperties,
  searchHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid var(--sys-border-subtle)',
    backgroundColor: 'var(--sys-bg-surface-tint)',
  } as React.CSSProperties,
  searchIcon: {
    fontSize: '1rem',
    marginRight: '12px',
    opacity: 0.6,
  } as React.CSSProperties,
  searchInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    color: 'var(--sys-txt-primary)',
    fontSize: '0.95rem',
    outline: 'none',
    fontFamily: 'var(--font-sans)',
  } as React.CSSProperties,
  escBadge: {
    padding: '3px 6px',
    borderRadius: '4px',
    border: '1px solid var(--sys-border-strong)',
    color: 'var(--sys-txt-muted)',
    fontSize: '0.65rem',
    fontFamily: 'var(--font-mono)',
    fontWeight: 600,
  } as React.CSSProperties,
  list: {
    maxHeight: '320px',
    overflowY: 'auto',
    padding: '8px',
  } as React.CSSProperties,
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    borderRadius: '6px',
    color: 'var(--sys-txt-secondary)',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.1s ease',
  } as React.CSSProperties,
  itemActive: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    borderRadius: '6px',
    backgroundColor: 'var(--sys-bg-surface-hover)',
    color: 'var(--sys-txt-primary)',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.1s ease',
  } as React.CSSProperties,
  itemTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  } as React.CSSProperties,
  itemBullet: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    width: '10px',
  } as React.CSSProperties,
  itemShortcut: {
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: 'var(--sys-bg-surface)',
    border: '1px solid var(--sys-border-subtle)',
    fontSize: '0.7rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--sys-txt-muted)',
  } as React.CSSProperties,
  emptyState: {
    padding: '24px',
    textAlign: 'center',
    color: 'var(--sys-txt-muted)',
    fontSize: '0.875rem',
  } as React.CSSProperties,
  footer: {
    padding: '10px 20px',
    borderTop: '1px solid var(--sys-border-subtle)',
    backgroundColor: 'var(--sys-bg-surface-tint)',
    fontSize: '0.7rem',
    color: 'var(--sys-txt-muted)',
    fontFamily: 'var(--font-mono)',
  } as React.CSSProperties,
};
