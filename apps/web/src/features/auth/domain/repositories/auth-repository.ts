import { AxiomUser } from '../entities/user';

export interface AuthRepository {
  getCurrentUser(): Promise<AxiomUser | null>;
  onAuthStateChanged(callback: (user: AxiomUser | null) => void): () => void;
  signInWithGoogle(): Promise<AxiomUser>;
  signInAnonymously(): Promise<AxiomUser>;
  signOut(): Promise<void>;
  linkWithGoogleCredential(idToken: string): Promise<AxiomUser>;
  deleteAccount(): Promise<void>;
  getToken(): Promise<string | null>;
}
