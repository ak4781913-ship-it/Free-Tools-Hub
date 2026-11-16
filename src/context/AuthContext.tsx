/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  User,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  auth,
  firebaseDiagnostics,
  googleProvider,
  isFirebaseConfigured,
  testFirestoreConnection,
} from '../firebase/firebase';
import {
  LAST_SYNCED_UID_KEY,
  WORKSPACE_MUTATED_EVENT,
  WorkspaceSyncSnapshot,
  applyWorkspaceSnapshotToLocal,
  clearPendingOfflineSnapshot,
  clearSyncedUserWorkspaceOnSignOut,
  ensureUserAccountRoot,
  fetchCloudWorkspaceState,
  getPendingOfflineSnapshot,
  hasCustomLocalWorkspaceData,
  mergeWorkspaceSnapshots,
  readLocalWorkspaceSnapshot,
  saveCloudWorkspaceState,
  savePendingOfflineSnapshot,
  syncPrivateUserProfile,
} from '../services/userSyncService';
import { useLanguage } from './LanguageContext';
import { useToast } from './ToastContext';

export type SyncStatus =
  | 'idle'
  | 'syncing'
  | 'synced'
  | 'offline'
  | 'pending'
  | 'conflict'
  | 'error';

export type AccountModalTab = 'account' | 'saved';

export type AuthOperationType =
  | 'signInWithPopup'
  | 'signInWithRedirect'
  | 'getRedirectResult'
  | 'signOut'
  | 'config';

export type AuthFlowType = 'popup' | 'redirect' | 'none';

export interface AuthErrorDetails {
  code: string;
  rawMessage: string;
  userMessage: string;
  diagnosticHint: string;
  operation: AuthOperationType;
  flow: AuthFlowType;
  isConfigured: boolean;
  configSource: string;
  hostname: string;
  authDomain: string;
  projectId: string;
  matchesAuthDomain: boolean;
  cancelled: boolean;
  popupBlocked: boolean;
  timestamp: string;
}

export interface SyncConflictData {
  localSnapshot: WorkspaceSyncSnapshot;
  cloudSnapshot: WorkspaceSyncSnapshot;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  authActionLoading: boolean;
  isConfigured: boolean;
  authError: string | null;
  authErrorDetails: AuthErrorDetails | null;
  lastAuthFlow: AuthFlowType;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  pendingConflict: SyncConflictData | null;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  isAccountModalOpen: boolean;
  accountModalTab: AccountModalTab;
  openAccountModal: (tab?: AccountModalTab) => void;
  closeAccountModal: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithGoogleRedirect: () => Promise<void>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
  resolveSyncConflict: (strategy: 'merge' | 'use-cloud' | 'use-local') => Promise<void>;
  syncNow: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapFirebaseAuthError(
  err: unknown,
  isUrdu: boolean,
  operation: AuthOperationType,
  flow: AuthFlowType
): AuthErrorDetails {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code?: unknown }).code || 'auth/unknown-error')
      : err instanceof Error && err.message.includes('auth/')
      ? (err.message.match(/auth\/[a-z0-9-]+/i)?.[0] || 'auth/unknown-error')
      : 'auth/unknown-error';

  const rawMessage =
    err instanceof Error
      ? err.message
      : typeof err === 'object' && err !== null && 'message' in err
      ? String((err as { message?: unknown }).message || 'Unknown authentication error')
      : String(err || 'Unknown authentication error');

  const hostname =
    typeof window !== 'undefined' ? window.location.hostname : firebaseDiagnostics.hostname;

  let cancelled = false;
  let popupBlocked = false;
  let userMessage = '';
  let diagnosticHint = '';

  switch (code) {
    case 'auth/unauthorized-domain':
      userMessage = isUrdu
        ? `ڈومین "${hostname}" Firebase Authentication کے مجاز ڈومینز (Authorized Domains) میں شامل نہیں ہے۔`
        : `Domain "${hostname}" is not listed under Authorized Domains in Firebase Authentication (${code}).`;
      diagnosticHint = isUrdu
        ? `Firebase Console → Authentication → Settings → Authorized domains میں جا کر "${hostname}" شامل کریں۔`
        : `Open Firebase Console (${firebaseDiagnostics.projectId || 'your project'}) → Authentication → Settings → Authorized domains and add "${hostname}".`;
      break;

    case 'auth/operation-not-allowed':
      userMessage = isUrdu
        ? `Firebase Console میں Google Sign-In پرووائیڈر فعال نہیں ہے (${code})۔`
        : `Google Sign-In provider is not enabled in Firebase Authentication (${code}).`;
      diagnosticHint = isUrdu
        ? 'Firebase Console → Authentication → Sign-in method میں Google کو فعال کریں اور سپورٹ ای میل محفوظ کریں۔'
        : 'Open Firebase Console → Authentication → Sign-in method → Google, enable the provider, set the support email, and save.';
      break;

    case 'auth/invalid-api-key':
      userMessage = isUrdu
        ? `فراہم کردہ Firebase Web API Key غلط یا پروجیکٹ سے مطابقت نہیں رکھتی (${code})۔`
        : `Invalid Firebase Web API Key for project "${firebaseDiagnostics.projectId || 'unknown'}" (${code}).`;
      diagnosticHint =
        'Verify VITE_FIREBASE_API_KEY in Netlify environment variables matches the exact Web API key in Firebase Project Settings.';
      break;

    case 'auth/popup-blocked':
      popupBlocked = true;
      userMessage = isUrdu
        ? `براؤزر نے Google سائن ان پاپ اپ بلاک کر دیا (${code})۔ نیچے دیے گئے ری ڈائریکٹ بٹن سے سائن ان کریں۔`
        : `Browser blocked the Google sign-in popup (${code}). Allow popups for this site or use browser redirect sign-in below.`;
      diagnosticHint =
        'Trigger sign-in using the browser redirect fallback button below or allow popups in browser site permissions.';
      break;

    case 'auth/popup-closed-by-user':
      cancelled = true;
      userMessage = isUrdu
        ? `گوگل سائن ان ونڈو مکمل ہونے سے پہلے بند کر دی گئی (${code})۔`
        : `Google sign-in popup was closed before completing login (${code}). You can try again anytime.`;
      diagnosticHint = 'No configuration error — the popup window was closed prior to OAuth completion.';
      break;

    case 'auth/cancelled-popup-request':
      cancelled = true;
      userMessage = isUrdu
        ? `پچھلی سائن ان درخواست نئی درخواست کی وجہ سے منسوخ ہو گئی (${code})۔`
        : `A competing popup sign-in request superseded the previous attempt (${code}). Please try signing in once more.`;
      diagnosticHint = 'Wait for the active sign-in window to finish rather than clicking multiple times.';
      break;

    case 'auth/unauthorized-client':
      userMessage = isUrdu
        ? `اس ایپ کا Google OAuth کلائنٹ مجاز نہیں ہے (${code})۔`
        : `Google OAuth client is not authorized for this Firebase project (${code}).`;
      diagnosticHint =
        'In Google Cloud Console → APIs & Services → Credentials, check the Web OAuth client used by Firebase Authentication has valid authorized JavaScript origins and redirect URIs (https://<authDomain>/__/auth/handler).';
      break;

    case 'auth/invalid-oauth-client-id':
      userMessage = isUrdu
        ? `Firebase Google پرووائیڈر میں OAuth Web Client ID غلط ہے (${code})۔`
        : `Invalid Google OAuth Web Client ID configured in Firebase Authentication (${code}).`;
      diagnosticHint =
        'Verify the Web SDK configuration under Firebase Console → Authentication → Sign-in method → Google → Web client ID matches your Google Cloud Web OAuth 2.0 Client ID.';
      break;

    case 'auth/operation-not-supported-in-this-environment':
      popupBlocked = true;
      userMessage = isUrdu
        ? `اس براؤزر یا ایمبیڈڈ فریم میں پاپ اپ سپورٹ نہیں ہے (${code})۔ ری ڈائریکٹ سائن ان استعمال کریں۔`
        : `Popup authentication is not supported in this browser or iframe environment (${code}).`;
      diagnosticHint = 'Use browser redirect sign-in or open the site directly in a standard top-level browser tab.';
      break;

    case 'auth/network-request-failed':
      userMessage = isUrdu
        ? `گوگل سائن ان سرور سے رابطہ نہ ہو سکا (${code})۔ اپنا انٹرنیٹ چیک کریں۔`
        : `Network request failed while reaching Google / Firebase Authentication (${code}).`;
      diagnosticHint =
        'Check internet connectivity, ad-blockers, VPN/firewall rules, or third-party cookie/script blockers affecting googleapis.com or firebaseapp.com.';
      break;

    default:
      userMessage = isUrdu
        ? `گوگل سائن ان میں خرابی پیش آئی (${code}): ${rawMessage}`
        : `Google authentication error (${code}): ${rawMessage}`;
      diagnosticHint = `Operation: ${operation} (${flow}) on host "${hostname}" with authDomain "${firebaseDiagnostics.authDomain || 'unset'}".`;
      break;
  }

  const details: AuthErrorDetails = {
    code,
    rawMessage,
    userMessage,
    diagnosticHint,
    operation,
    flow,
    isConfigured: isFirebaseConfigured,
    configSource: firebaseDiagnostics.configSource,
    hostname,
    authDomain: firebaseDiagnostics.authDomain,
    projectId: firebaseDiagnostics.projectId,
    matchesAuthDomain: firebaseDiagnostics.matchesAuthDomain,
    cancelled,
    popupBlocked,
    timestamp: new Date().toISOString(),
  };

  console.error('[Firebase Auth Error]', {
    code: details.code,
    message: details.rawMessage,
    operation: details.operation,
    flow: details.flow,
    isConfigured: details.isConfigured,
    configSource: details.configSource,
    projectId: details.projectId,
    authDomain: details.authDomain,
    hostname: details.hostname,
    matchesAuthDomain: details.matchesAuthDomain,
    consistencyWarnings: firebaseDiagnostics.consistencyWarnings,
  });

  return details;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isUrdu = language === 'ur';

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(isFirebaseConfigured && auth));
  const [authActionLoading, setAuthActionLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authErrorDetails, setAuthErrorDetails] = useState<AuthErrorDetails | null>(null);
  const [lastAuthFlow, setLastAuthFlow] = useState<AuthFlowType>('none');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [pendingConflict, setPendingConflict] = useState<SyncConflictData | null>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);
  const [accountModalTab, setAccountModalTab] = useState<AccountModalTab>('account');

  const isHydratingRef = useRef<boolean>(false);
  const syncDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeUidRef = useRef<string | null>(null);

  // Test Firestore connection once on mount (per firebase-integration-rpc guidelines)
  useEffect(() => {
    if (isFirebaseConfigured) {
      testFirestoreConnection().catch(() => {});
    }
  }, []);

  const hydrateUserCloudWorkspace = useCallback(
    async (signedInUser: User) => {
      if (!isFirebaseConfigured) return;

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setSyncStatus('offline');
        return;
      }

      if (syncDebounceRef.current) {
        clearTimeout(syncDebounceRef.current);
        syncDebounceRef.current = null;
      }

      setSyncStatus('syncing');
      isHydratingRef.current = true;

      try {
        await ensureUserAccountRoot(signedInUser.uid);
        await syncPrivateUserProfile(signedInUser);

        const cloudRecord = await fetchCloudWorkspaceState(signedInUser.uid);
        const localSnapshot = readLocalWorkspaceSnapshot();
        const pendingOffline = getPendingOfflineSnapshot(signedInUser.uid);

        let lastSyncedUid: string | null = null;
        try {
          lastSyncedUid = localStorage.getItem(LAST_SYNCED_UID_KEY);
        } catch {
          lastSyncedUid = null;
        }

        if (!cloudRecord) {
          // First time signing in with this Google account: migrate local workspace safely to new cloud record
          const initialSnapshot = pendingOffline
            ? mergeWorkspaceSnapshots(localSnapshot, pendingOffline)
            : localSnapshot;

          await saveCloudWorkspaceState(signedInUser.uid, initialSnapshot);
          clearPendingOfflineSnapshot(signedInUser.uid);
          try {
            localStorage.setItem(LAST_SYNCED_UID_KEY, signedInUser.uid);
          } catch {}
          setSyncStatus('synced');
          setLastSyncedAt(new Date().toISOString());
          setPendingConflict(null);
          return;
        }

        // Cloud record ALREADY exists: never overwrite cloud data silently!
        if (pendingOffline) {
          const mergedPending = mergeWorkspaceSnapshots(pendingOffline, cloudRecord.snapshot);
          await saveCloudWorkspaceState(signedInUser.uid, mergedPending);
          applyWorkspaceSnapshotToLocal(mergedPending);
          clearPendingOfflineSnapshot(signedInUser.uid);
          try {
            localStorage.setItem(LAST_SYNCED_UID_KEY, signedInUser.uid);
          } catch {}
          setSyncStatus('synced');
          setLastSyncedAt(new Date().toISOString());
          setPendingConflict(null);
          return;
        }

        const hasLocalMods = hasCustomLocalWorkspaceData(localSnapshot);

        if (lastSyncedUid !== signedInUser.uid && hasLocalMods) {
          // Different/anonymous local session has custom changes AND cloud account already has saved data: ask user explicitly
          setPendingConflict({
            localSnapshot,
            cloudSnapshot: cloudRecord.snapshot,
          });
          setSyncStatus('conflict');
          setIsAuthModalOpen(true);
          return;
        }

        // Same user session or fresh default local state -> hydrate cloud state cleanly
        applyWorkspaceSnapshotToLocal(cloudRecord.snapshot);
        try {
          localStorage.setItem(LAST_SYNCED_UID_KEY, signedInUser.uid);
        } catch {}
        setSyncStatus('synced');
        setLastSyncedAt(new Date().toISOString());
        setPendingConflict(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
        if (msg.includes('offline') || msg.includes('unavailable') || msg.includes('network')) {
          setSyncStatus('offline');
        } else {
          console.warn('[AuthContext] Workspace sync warning:', err);
          setSyncStatus('error');
        }
      } finally {
        // Defer unlocking mutation listener so hydration events don't bounce right back to Firestore
        setTimeout(() => {
          isHydratingRef.current = false;
        }, 250);
      }
    },
    []
  );

  // Listen to Firebase Auth state persistence + resolve any pending redirect sign-in result
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setLastAuthFlow('redirect');
          setAuthError(null);
          setAuthErrorDetails(null);
          setIsAuthModalOpen(false);
        }
      })
      .catch((err) => {
        const mapped = mapFirebaseAuthError(err, isUrdu, 'getRedirectResult', 'redirect');
        if (!mapped.cancelled) {
          setAuthError(mapped.userMessage);
          setAuthErrorDetails(mapped);
          setIsAuthModalOpen(true);
        }
      });

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      activeUidRef.current = firebaseUser?.uid || null;
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        setAuthError(null);
        setAuthErrorDetails(null);
        void hydrateUserCloudWorkspace(firebaseUser);
      } else {
        setPendingConflict(null);
        setSyncStatus('idle');
        setLastSyncedAt(null);
      }
    });

    return () => unsubscribe();
  }, [hydrateUserCloudWorkspace, isUrdu]);

  const performWorkspacePush = useCallback(
    async (targetUid: string) => {
      const snapshot = readLocalWorkspaceSnapshot();

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        savePendingOfflineSnapshot(targetUid, snapshot);
        setSyncStatus('offline');
        return;
      }

      setSyncStatus('syncing');
      try {
        await saveCloudWorkspaceState(targetUid, snapshot);
        clearPendingOfflineSnapshot(targetUid);
        setSyncStatus('synced');
        setLastSyncedAt(new Date().toISOString());
      } catch (err) {
        const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
        if (msg.includes('offline') || msg.includes('unavailable') || msg.includes('network')) {
          savePendingOfflineSnapshot(targetUid, snapshot);
          setSyncStatus('offline');
        } else {
          setSyncStatus('error');
        }
      }
    },
    []
  );

  // Debounced auto-sync when signed-in user modifies Favorites, Goals, History, Theme, Language, Prompts, or Colors
  useEffect(() => {
    if (!user || !isFirebaseConfigured) return;

    const scheduleSync = () => {
      if (isHydratingRef.current || pendingConflict) return;
      if (syncDebounceRef.current) {
        clearTimeout(syncDebounceRef.current);
      }
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        savePendingOfflineSnapshot(user.uid, readLocalWorkspaceSnapshot());
        setSyncStatus('pending');
        return;
      }
      syncDebounceRef.current = setTimeout(() => {
        if (activeUidRef.current === user.uid && !pendingConflict) {
          void performWorkspacePush(user.uid);
        }
      }, 800);
    };

    const handleOnline = () => {
      if (activeUidRef.current === user.uid) {
        void hydrateUserCloudWorkspace(user);
      }
    };

    window.addEventListener(WORKSPACE_MUTATED_EVENT, scheduleSync);
    window.addEventListener('freetools_daily_goal_updated', scheduleSync);
    window.addEventListener('freetools_print_history_changed', scheduleSync);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener(WORKSPACE_MUTATED_EVENT, scheduleSync);
      window.removeEventListener('freetools_daily_goal_updated', scheduleSync);
      window.removeEventListener('freetools_print_history_changed', scheduleSync);
      window.removeEventListener('online', handleOnline);
      if (syncDebounceRef.current) {
        clearTimeout(syncDebounceRef.current);
      }
    };
  }, [user, pendingConflict, performWorkspacePush, hydrateUserCloudWorkspace]);

  const signInWithGoogle = useCallback(async () => {
    setLastAuthFlow('popup');

    if (!isFirebaseConfigured || !auth || !googleProvider) {
      const mapped = mapFirebaseAuthError(
        {
          code: 'auth/invalid-api-key',
          message: `Firebase configuration not loaded (source=${firebaseDiagnostics.configSource}, projectId=${firebaseDiagnostics.projectId || 'unset'}).`,
        },
        isUrdu,
        'config',
        'popup'
      );
      setAuthError(mapped.userMessage);
      setAuthErrorDetails(mapped);
      setIsAuthModalOpen(true);
      return;
    }

    setAuthActionLoading(true);
    setAuthError(null);
    setAuthErrorDetails(null);

    try {
      const credential = await signInWithPopup(auth, googleProvider);
      setIsAuthModalOpen(false);
      toast.success(
        isUrdu ? 'کامیابی سے لاگ ان ہو گیا' : 'Signed in with Google',
        credential.user.displayName
          ? isUrdu
            ? `خوش آمدید، ${credential.user.displayName}`
            : `Welcome back, ${credential.user.displayName}`
          : undefined,
        { compact: true, duration: 3200, dedupeKey: 'auth-signin' }
      );
    } catch (err) {
      const mapped = mapFirebaseAuthError(err, isUrdu, 'signInWithPopup', 'popup');
      setAuthError(mapped.userMessage);
      setAuthErrorDetails(mapped);
      if (mapped.cancelled) {
        toast.info(
          isUrdu ? 'سائن ان منسوخ کر دیا گیا' : 'Google Sign-In Cancelled',
          mapped.userMessage,
          { compact: true, duration: 3500, dedupeKey: 'auth-cancelled' }
        );
      } else {
        setIsAuthModalOpen(true);
      }
    } finally {
      setAuthActionLoading(false);
    }
  }, [isUrdu, toast]);

  const signInWithGoogleRedirect = useCallback(async () => {
    setLastAuthFlow('redirect');

    if (!isFirebaseConfigured || !auth || !googleProvider) {
      const mapped = mapFirebaseAuthError(
        {
          code: 'auth/invalid-api-key',
          message: `Firebase configuration not loaded (source=${firebaseDiagnostics.configSource}).`,
        },
        isUrdu,
        'config',
        'redirect'
      );
      setAuthError(mapped.userMessage);
      setAuthErrorDetails(mapped);
      return;
    }

    setAuthActionLoading(true);
    setAuthError(null);
    setAuthErrorDetails(null);

    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (err) {
      const mapped = mapFirebaseAuthError(err, isUrdu, 'signInWithRedirect', 'redirect');
      setAuthError(mapped.userMessage);
      setAuthErrorDetails(mapped);
      setAuthActionLoading(false);
    }
  }, [isUrdu]);

  const signOut = useCallback(async () => {
    if (!auth) return;
    setAuthActionLoading(true);
    try {
      if (syncDebounceRef.current) {
        clearTimeout(syncDebounceRef.current);
      }
      await firebaseSignOut(auth);
      isHydratingRef.current = true;
      clearSyncedUserWorkspaceOnSignOut();
      setIsAccountModalOpen(false);
      setPendingConflict(null);
      setSyncStatus('idle');
      setLastSyncedAt(null);
      setAuthError(null);
      setAuthErrorDetails(null);
      toast.info(
        isUrdu ? 'سائن آؤٹ ہو گیا' : 'Signed Out',
        isUrdu
          ? 'آپ کے مقامی سیشن کو محفوظ طور پر گیسٹ موڈ میں تبدیل کر دیا گیا ہے۔'
          : 'Your account session was closed safely.',
        { compact: true, duration: 3000, dedupeKey: 'auth-signout' }
      );
    } catch (err) {
      const mapped = mapFirebaseAuthError(err, isUrdu, 'signOut', 'none');
      setAuthError(mapped.userMessage);
      setAuthErrorDetails(mapped);
      toast.error(
        isUrdu ? 'سائن آؤٹ میں خرابی' : 'Sign-out failed',
        mapped.userMessage
      );
    } finally {
      setTimeout(() => {
        isHydratingRef.current = false;
      }, 250);
      setAuthActionLoading(false);
    }
  }, [isUrdu, toast]);

  const resolveSyncConflict = useCallback(
    async (strategy: 'merge' | 'use-cloud' | 'use-local') => {
      if (!user || !pendingConflict) return;
      isHydratingRef.current = true;
      setSyncStatus('syncing');

      try {
        let finalSnapshot: WorkspaceSyncSnapshot;
        if (strategy === 'merge') {
          finalSnapshot = mergeWorkspaceSnapshots(
            pendingConflict.localSnapshot,
            pendingConflict.cloudSnapshot
          );
          await saveCloudWorkspaceState(user.uid, finalSnapshot);
        } else if (strategy === 'use-local') {
          finalSnapshot = pendingConflict.localSnapshot;
          await saveCloudWorkspaceState(user.uid, finalSnapshot);
        } else {
          finalSnapshot = pendingConflict.cloudSnapshot;
        }

        applyWorkspaceSnapshotToLocal(finalSnapshot);
        try {
          localStorage.setItem(LAST_SYNCED_UID_KEY, user.uid);
        } catch {}
        clearPendingOfflineSnapshot(user.uid);
        setPendingConflict(null);
        setSyncStatus('synced');
        setLastSyncedAt(new Date().toISOString());
        setIsAuthModalOpen(false);

        toast.success(
          isUrdu ? 'ڈیٹا کامیابی سے سنک ہو گیا' : 'Workspace Synced',
          isUrdu
            ? 'آپ کے پسندیدہ ٹولز اور ترجیحات محفوظ ہو گئی ہیں۔'
            : 'Your Google account workspace is now synchronized.',
          { compact: true, duration: 3200, dedupeKey: 'sync-resolved' }
        );
      } catch {
        setSyncStatus('error');
        toast.error(
          isUrdu ? 'سنک کرنے میں ناکامی' : 'Sync Error',
          isUrdu
            ? 'کلاؤڈ ڈیٹا اپ ڈیٹ نہ ہو سکا۔ دوبارہ کوشش کریں۔'
            : 'Could not finalize cloud sync. Please check your connection and try again.'
        );
      } finally {
        setTimeout(() => {
          isHydratingRef.current = false;
        }, 250);
      }
    },
    [user, pendingConflict, isUrdu, toast]
  );

  const syncNow = useCallback(async () => {
    if (!user) return;
    if (pendingConflict) {
      setIsAuthModalOpen(true);
      return;
    }
    await performWorkspacePush(user.uid);
  }, [user, pendingConflict, performWorkspacePush]);

  const openAuthModal = useCallback(() => {
    setAuthError(null);
    setAuthErrorDetails(null);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const openAccountModal = useCallback((tab: AccountModalTab = 'account') => {
    setAccountModalTab(tab);
    setIsAccountModalOpen(true);
  }, []);

  const closeAccountModal = useCallback(() => {
    setIsAccountModalOpen(false);
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
    setAuthErrorDetails(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authActionLoading,
        isConfigured: isFirebaseConfigured,
        authError,
        authErrorDetails,
        lastAuthFlow,
        syncStatus,
        lastSyncedAt,
        pendingConflict,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        isAccountModalOpen,
        accountModalTab,
        openAccountModal,
        closeAccountModal,
        signInWithGoogle,
        signInWithGoogleRedirect,
        signOut,
        clearAuthError,
        resolveSyncConflict,
        syncNow,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
