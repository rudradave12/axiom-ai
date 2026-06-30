'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/shared/stores/auth-store';
import { usePreferenceStore } from '@/shared/stores/preference-store';

export default function ProfilePage(): React.JSX.Element {
  const { user, profile, initialized, error: authError, signOut, deleteAccount } = useAuthStore();
  const { preferences, updatePreferences } = usePreferenceStore();
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  const handleLogout = async (): Promise<void> => {
    try {
      await signOut();
      router.push('/login');
    } catch (err) {
      // Handled globally / logs
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (window.confirm('Are you sure you want to permanently delete your AXIOM account? This cannot be undone.')) {
      try {
        await deleteAccount();
        router.push('/login');
      } catch (err) {
        alert('Re-authentication required before deleting account. Please log in again.');
      }
    }
  };

  const handleThemeChange = async (theme: 'light' | 'dark' | 'system'): Promise<void> => {
    setUpdating(true);
    try {
      await updatePreferences({ theme });
    } finally {
      setUpdating(false);
    }
  };

  const handleImprovementsToggle = async (): Promise<void> => {
    setUpdating(true);
    try {
      await updatePreferences({
        autonomousImprovements: !preferences.autonomousImprovements,
      });
    } finally {
      setUpdating(false);
    }
  };

  if (!initialized || !user) {
    return <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#1a56db', fontWeight: 600 }}>Loading account profile...</div>;
  }

  const stats = profile?.stats || { missionsActive: 0, missionsCompleted: 0, totalConcepts: 0 };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={() => router.push('/')} style={styles.backButton}>
          ← Back to Dashboard
        </button>
        <h1 style={styles.title}>Account Settings</h1>
      </header>

      {authError && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fde8e8', color: '#e02424', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem', border: '1px solid #f8b4b4' }}>
          <strong>Database Connection Warning:</strong> {authError} (The app is running in local-fallback mode).
        </div>
      )}

      <main style={styles.main}>
        {/* User Card */}
        <section style={styles.sectionCard}>
          <div style={styles.avatarRow}>
            {user.photoURL ? (
              <img src={user.photoURL} alt="Avatar" style={styles.avatarImage} />
            ) : (
              <div style={styles.avatarPlaceholder}>
                {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
              </div>
            )}
            <div style={styles.metaCol}>
              <h2 style={styles.profileName}>{user.displayName || 'Guest User'}</h2>
              <span style={styles.profileEmail}>
                {user.isAnonymous ? 'Anonymous Guest Profile' : user.email}
              </span>
            </div>
          </div>
          <div style={styles.uidRow}>
            <span>User Identity ID:</span>
            <code>{user.uid}</code>
          </div>
        </section>

        {/* Preferences */}
        <section style={styles.sectionCard}>
          <h3 style={styles.sectionTitle}>Application Preferences</h3>

          <div style={styles.settingRow}>
            <label style={styles.label}>Color Theme Mode</label>
            <select
              value={preferences.theme}
              onChange={(e) => handleThemeChange(e.target.value as 'light' | 'dark' | 'system')}
              disabled={updating}
              style={styles.select}
            >
              <option value="light">Light Mode</option>
              <option value="dark">Dark Mode</option>
              <option value="system">Follow System</option>
            </select>
          </div>

          <div style={styles.settingRow}>
            <label style={styles.label}>Language Configuration</label>
            <select
              value={preferences.language}
              onChange={(e) => updatePreferences({ language: e.target.value })}
              disabled={updating}
              style={styles.select}
            >
              <option value="en">English (US)</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </select>
          </div>

          <div style={styles.settingRow}>
            <div style={styles.toggleText}>
              <span style={styles.label}>Autonomous System Improvements</span>
              <p style={styles.hint}>Allow AI to optimize timelines and merge duplicate nodes nightly.</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.autonomousImprovements}
              onChange={handleImprovementsToggle}
              disabled={updating}
              style={styles.checkbox}
            />
          </div>
        </section>

        {/* Statistics */}
        <section style={styles.sectionCard}>
          <h3 style={styles.sectionTitle}>Mission Execution Statistics</h3>
          <div style={styles.statsGrid}>
            <div style={styles.statBox}>
              <span style={styles.statNumber}>{stats.missionsActive}</span>
              <span style={styles.statLabel}>Active Missions</span>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statNumber}>{stats.missionsCompleted}</span>
              <span style={styles.statLabel}>Completed Missions</span>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statNumber}>{stats.totalConcepts}</span>
              <span style={styles.statLabel}>Concepts Mapped</span>
            </div>
          </div>
        </section>

        {/* Actions */}
        <section style={styles.sectionActions}>
          <button onClick={handleLogout} style={styles.buttonLogout}>
            Sign Out
          </button>
          <button onClick={handleDelete} style={styles.buttonDelete}>
            Delete Profile Account
          </button>
        </section>
      </main>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '640px',
    margin: '0 auto',
    padding: '2rem 1rem',
  } as React.CSSProperties,
  header: {
    marginBottom: '2rem',
  } as React.CSSProperties,
  backButton: {
    background: 'none',
    border: 'none',
    color: '#1a56db',
    fontSize: '0.875rem',
    cursor: 'pointer',
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#1a56db',
  } as React.CSSProperties,
  main: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  } as React.CSSProperties,
  sectionCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #f3f4f6',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  } as React.CSSProperties,
  avatarRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem',
  } as React.CSSProperties,
  avatarImage: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
  } as React.CSSProperties,
  avatarPlaceholder: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#1a56db',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '1.25rem',
  } as React.CSSProperties,
  metaCol: {
    display: 'flex',
    flexDirection: 'column',
  } as React.CSSProperties,
  profileName: {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: '#111827',
  } as React.CSSProperties,
  profileEmail: {
    fontSize: '0.875rem',
    color: '#4b5563',
  } as React.CSSProperties,
  uidRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: '#9ca3af',
    borderTop: '1px solid #f3f4f6',
    paddingTop: '0.75rem',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#1a56db',
    marginBottom: '1.25rem',
  } as React.CSSProperties,
  settingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 0',
    borderBottom: '1px solid #f9fafb',
  } as React.CSSProperties,
  label: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#374151',
  } as React.CSSProperties,
  hint: {
    fontSize: '0.75rem',
    color: '#6b7280',
    marginTop: '0.125rem',
  } as React.CSSProperties,
  toggleText: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '80%',
  } as React.CSSProperties,
  select: {
    padding: '0.375rem 1.5rem 0.375rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    fontSize: '0.875rem',
    color: '#374151',
    cursor: 'pointer',
  } as React.CSSProperties,
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  } as React.CSSProperties,
  statsGrid: {
    display: 'flex',
    gap: '1rem',
  } as React.CSSProperties,
  statBox: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    borderRadius: '8px',
    backgroundColor: '#f9fafb',
    border: '1px solid #f3f4f6',
  } as React.CSSProperties,
  statNumber: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1a56db',
  } as React.CSSProperties,
  statLabel: {
    fontSize: '0.75rem',
    color: '#6b7280',
    marginTop: '0.25rem',
  } as React.CSSProperties,
  sectionActions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1.5rem',
  } as React.CSSProperties,
  buttonLogout: {
    flex: 1,
    padding: '0.75rem',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    color: '#374151',
    border: '1px solid #d1d5db',
    fontWeight: 500,
    cursor: 'pointer',
  } as React.CSSProperties,
  buttonDelete: {
    flex: 1,
    padding: '0.75rem',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    color: '#e02424',
    border: '1px solid #f8b4b4',
    fontWeight: 500,
    cursor: 'pointer',
  } as React.CSSProperties,
};
