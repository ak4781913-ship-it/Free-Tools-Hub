/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  GoogleAuthProvider,
  browserLocalPersistence,
  getAuth,
  setPersistence,
} from 'firebase/auth';
import {
  Firestore,
  doc,
  getDocFromServer,
  getFirestore,
} from 'firebase/firestore';

export interface FirebaseRuntimeConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  firestoreDatabaseId?: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export interface FirebaseConfigDiagnostics {
  isConfigured: boolean;
  configSource: 'env' | 'applet-config' | 'env+applet-config' | 'none';
  hasApiKey: boolean;
  projectId: string;
  authDomain: string;
  appId: string;
  messagingSenderId: string;
  firestoreDatabaseId: string;
  hostname: string;
  matchesAuthDomain: boolean;
  consistencyWarnings: string[];
}

// Vite statically transforms import.meta.glob at build/serve time (resolves to {} if file is absent).
// Do NOT guard with `typeof import.meta.glob === 'function'`, because Vite leaves `typeof` checks untouched
// while removing `import.meta.glob` at runtime in the browser, causing the guard to always return false!
let fileConfig: Partial<FirebaseRuntimeConfig> = {};
try {
  const appletConfigModules = import.meta.glob<{ default?: Partial<FirebaseRuntimeConfig> }>(
    '/firebase-applet-config.json',
    { eager: true }
  );
  const firstMod = Object.values(appletConfigModules)[0];
  fileConfig =
    firstMod?.default ||
    (firstMod && typeof firstMod === 'object' ? (firstMod as Partial<FirebaseRuntimeConfig>) : {});
} catch {
  // Executed outside Vite bundler (e.g., Node/Bun unit tests)
  fileConfig = {};
}

function readEnvString(key: string): string {
  try {
    const val = (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.[key];
    return typeof val === 'string' ? val.trim() : '';
  } catch {
    return '';
  }
}

const envConfig: Partial<FirebaseRuntimeConfig> = {
  apiKey: readEnvString('VITE_FIREBASE_API_KEY'),
  authDomain: readEnvString('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: readEnvString('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: readEnvString('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: readEnvString('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: readEnvString('VITE_FIREBASE_APP_ID'),
  firestoreDatabaseId:
    readEnvString('VITE_FIREBASE_DATABASE_ID') ||
    readEnvString('VITE_FIREBASE_FIRESTORE_DATABASE_ID'),
};

const hasAnyEnvOverride = Boolean(
  envConfig.apiKey ||
    envConfig.authDomain ||
    envConfig.projectId ||
    envConfig.appId ||
    envConfig.messagingSenderId
);
const hasFileConfig = Boolean(fileConfig.apiKey || fileConfig.projectId || fileConfig.appId);

// If envConfig explicitly targets a different projectId than fileConfig, do not mix fields from different projects.
const envTargetsDifferentProject = Boolean(
  envConfig.projectId &&
    fileConfig.projectId &&
    envConfig.projectId !== fileConfig.projectId
);

const effectiveFileConfig: Partial<FirebaseRuntimeConfig> = envTargetsDifferentProject
  ? {}
  : fileConfig;

const resolvedProjectId = envConfig.projectId || effectiveFileConfig.projectId || '';
const resolvedApiKey = envConfig.apiKey || effectiveFileConfig.apiKey || '';
const resolvedAppId = envConfig.appId || effectiveFileConfig.appId || '';
const resolvedSenderId =
  envConfig.messagingSenderId || effectiveFileConfig.messagingSenderId || '';
const resolvedAuthDomain =
  envConfig.authDomain ||
  effectiveFileConfig.authDomain ||
  (resolvedProjectId ? `${resolvedProjectId}.firebaseapp.com` : '');

export const firebaseConfig: FirebaseRuntimeConfig = {
  apiKey: resolvedApiKey,
  authDomain: resolvedAuthDomain,
  projectId: resolvedProjectId,
  storageBucket:
    envConfig.storageBucket ||
    effectiveFileConfig.storageBucket ||
    (resolvedProjectId ? `${resolvedProjectId}.firebasestorage.app` : ''),
  messagingSenderId: resolvedSenderId,
  appId: resolvedAppId,
  measurementId: effectiveFileConfig.measurementId || '',
  firestoreDatabaseId:
    envConfig.firestoreDatabaseId || effectiveFileConfig.firestoreDatabaseId || '',
};

export const isFirebaseConfigured: boolean = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId &&
    firebaseConfig.projectId !== 'remixed-project-id'
);

const consistencyWarnings: string[] = [];
if (envTargetsDifferentProject) {
  consistencyWarnings.push(
    'VITE_FIREBASE_PROJECT_ID differs from bundled applet config; using environment overrides only.'
  );
}
if (firebaseConfig.appId && firebaseConfig.messagingSenderId) {
  const appIdParts = firebaseConfig.appId.split(':');
  if (appIdParts.length >= 2 && appIdParts[1] !== firebaseConfig.messagingSenderId) {
    consistencyWarnings.push(
      'appId sender segment does not match messagingSenderId; check VITE_FIREBASE_APP_ID and VITE_FIREBASE_MESSAGING_SENDER_ID.'
    );
  }
}
if (
  firebaseConfig.projectId &&
  firebaseConfig.authDomain &&
  firebaseConfig.authDomain.endsWith('.firebaseapp.com') &&
  firebaseConfig.authDomain !== `${firebaseConfig.projectId}.firebaseapp.com`
) {
  consistencyWarnings.push(
    `authDomain (${firebaseConfig.authDomain}) does not match projectId (${firebaseConfig.projectId}).`
  );
}

const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

export const firebaseDiagnostics: FirebaseConfigDiagnostics = {
  isConfigured: isFirebaseConfigured,
  configSource:
    hasAnyEnvOverride && !envTargetsDifferentProject && hasFileConfig
      ? 'env+applet-config'
      : hasAnyEnvOverride
      ? 'env'
      : hasFileConfig
      ? 'applet-config'
      : 'none',
  hasApiKey: Boolean(firebaseConfig.apiKey),
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  appId: firebaseConfig.appId,
  messagingSenderId: firebaseConfig.messagingSenderId,
  firestoreDatabaseId: firebaseConfig.firestoreDatabaseId || '(default)',
  hostname: currentHostname,
  matchesAuthDomain: Boolean(
    currentHostname &&
      firebaseConfig.authDomain &&
      (currentHostname === firebaseConfig.authDomain ||
        currentHostname === `${firebaseConfig.projectId}.web.app`)
  ),
  consistencyWarnings,
};

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let googleProviderInstance: GoogleAuthProvider | null = null;

if (typeof window !== 'undefined' && isFirebaseConfigured) {
  try {
    appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    authInstance = getAuth(appInstance);
    dbInstance = firebaseConfig.firestoreDatabaseId
      ? getFirestore(appInstance, firebaseConfig.firestoreDatabaseId)
      : getFirestore(appInstance);

    googleProviderInstance = new GoogleAuthProvider();
    googleProviderInstance.setCustomParameters({
      prompt: 'select_account',
    });

    setPersistence(authInstance, browserLocalPersistence).catch((err) => {
      console.warn('[Firebase Auth] browserLocalPersistence unavailable:', err);
    });
  } catch (err) {
    console.warn('[Firebase] Initialization skipped due to invalid configuration:', err);
    appInstance = null;
    authInstance = null;
    dbInstance = null;
    googleProviderInstance = null;
  }
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;
export const googleProvider = googleProviderInstance;

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentUser = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid ?? null,
      email: currentUser?.email ?? null,
      emailVerified: currentUser?.emailVerified ?? null,
      isAnonymous: currentUser?.isAnonymous ?? null,
      tenantId: currentUser?.tenantId ?? null,
      providerInfo:
        currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

let connectionTested = false;

export async function testFirestoreConnection(): Promise<boolean> {
  if (!db || connectionTested || typeof window === 'undefined') {
    return Boolean(db);
  }
  connectionTested = true;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('the client is offline')) {
      console.warn('[Firebase] Firestore client appears offline or unreachable. Verify Firebase configuration.');
      return false;
    }
    // permission-denied on default-deny /test/connection confirms live server round-trip succeeded
    return true;
  }
}
