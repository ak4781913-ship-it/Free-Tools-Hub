import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Workbox service worker with auto-update and offline readiness
let updateSWFn: ((reloadPage?: boolean) => Promise<void>) | null = null;

updateSWFn = registerSW({
  onNeedRefresh() {
    console.log('[PWA] New content available, updating cache...');
    window.dispatchEvent(
      new CustomEvent('pwa-need-refresh', {
        detail: { updateSW: updateSWFn },
      })
    );
  },
  onOfflineReady() {
    console.log('[PWA] FreeTools Hub is ready to work offline with Workbox.');
    window.dispatchEvent(new CustomEvent('pwa-offline-ready'));
  },
  onRegistered(registration) {
    if (registration) {
      window.dispatchEvent(
        new CustomEvent('pwa-registered', {
          detail: { registration },
        })
      );
    }
  },
  onRegisterError(error) {
    console.warn('[PWA] Service worker registration failed:', error);
  },
});

createRoot(document.getElementById('root')!).render(<App />);
