import {
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously as firebaseSignInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  deleteUser,
  linkWithCredential,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@/shared/lib/firebase';
import { AuthRepository } from '../../domain/repositories/auth-repository';
import { AxiomUser } from '../../domain/entities/user';

export class FirebaseAuthRepository implements AuthRepository {
  private mapFirebaseUser(user: FirebaseUser): AxiomUser {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      isAnonymous: user.isAnonymous,
      createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime) : new Date(),
      lastLoginAt: user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : new Date(),
    };
  }

  public async getCurrentUser(): Promise<AxiomUser | null> {
    const user = auth.currentUser;
    return user ? this.mapFirebaseUser(user) : null;
  }

  public onAuthStateChanged(callback: (user: AxiomUser | null) => void): () => void {
    return firebaseOnAuthStateChanged(auth, (user) => {
      callback(user ? this.mapFirebaseUser(user) : null);
    });
  }

  public async signInWithGoogle(): Promise<AxiomUser> {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return this.mapFirebaseUser(result.user);
  }

  public async signInAnonymously(): Promise<AxiomUser> {
    const result = await firebaseSignInAnonymously(auth);
    return this.mapFirebaseUser(result.user);
  }

  public async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  }

  public async linkWithGoogleCredential(idToken: string): Promise<AxiomUser> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No active user session to link credential to.');
    }
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await linkWithCredential(user, credential);
    return this.mapFirebaseUser(result.user);
  }

  public async deleteAccount(): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No active user session to delete.');
    }
    await deleteUser(user);
  }

  public async getToken(): Promise<string | null> {
    const user = auth.currentUser;
    return user ? user.getIdToken(true) : null;
  }
}
export default FirebaseAuthRepository;
