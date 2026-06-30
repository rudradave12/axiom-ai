import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator, setPersistence, browserLocalPersistence } from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

function initializeFirebaseServices(): void {
  if (getApps().length === 0) {
    // Print the active initialized project ID for logging
    // eslint-disable-next-line no-console
    console.log('Initializing Firebase Config:', JSON.stringify(firebaseConfig, null, 2));
    
    app = initializeApp(firebaseConfig);

    // Initialize Firestore with persistent multi-tab local cache support
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });

    auth = getAuth(app);
    // Enforce local session persistence explicitly
    if (typeof window !== 'undefined') {
      setPersistence(auth, browserLocalPersistence).catch((err) => {
        console.warn('Firebase Auth persistence initialization failed:', err);
      });
    }
    storage = getStorage(app);

    // Initialize App Check for client-side environments securely in production only
    if (typeof window !== 'undefined') {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Firebase App Check is disabled in development environment.');
      } else {
        const debugToken = process.env.NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN || '';
        if (debugToken) {
          (window as unknown as Record<string, unknown>).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
        }
        try {
          initializeAppCheck(app, {
            provider: new ReCaptchaV3Provider(
              process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!
            ),
            isTokenAutoRefreshEnabled: true,
          });
        } catch (err) {
          console.warn('Firebase App Check initialization failed:', err);
        }
      }
    }

    // Check for Emulator Environment
    const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
    if (useEmulator) {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
      connectStorageEmulator(storage, '127.0.0.1', 9199);
    }
  } else {
    app = getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
  }
}

// Lazy initialization execution wrapper
initializeFirebaseServices();

export { app, auth, db, storage };
export default app!;
