import { describe, it, expect, vi } from 'vitest';
import { FirebaseAuthRepository } from './firebase-auth-repository';

// Mock Firebase Auth SDK elements
vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: class {},
  signInWithPopup: vi.fn(),
  signInAnonymously: vi.fn().mockResolvedValue({
    user: {
      uid: 'mock-uid-123',
      email: 'guest@axiom.ai',
      displayName: 'Guest Tester',
      photoURL: null,
      isAnonymous: true,
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString(),
      },
    },
  }),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  deleteUser: vi.fn(),
  linkWithCredential: vi.fn(),
}));

vi.mock('@/shared/lib/firebase', () => ({
  auth: {},
}));

describe('FirebaseAuthRepository', () => {
  it('should initialize and execute anonymous logins successfully', async () => {
    const repository = new FirebaseAuthRepository();
    const guestUser = await repository.signInAnonymously();

    expect(guestUser.uid).toBe('mock-uid-123');
    expect(guestUser.isAnonymous).toBe(true);
    expect(guestUser.email).toBe('guest@axiom.ai');
  });
});
