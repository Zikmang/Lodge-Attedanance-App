import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';

// 1. Immediately render React application so nothing blocks UI mounting
const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}

// 2. Safe Service Worker Lifecycle Management
// In development, automatically unregister stale dev service workers and caches that cause blank loading screens
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        if (reg.active?.scriptURL.includes('dev-sw') || reg.scope.includes('localhost')) {
          reg.unregister();
        }
      }
    });

    if ('caches' in window) {
      caches.keys().then((names) => {
        for (const name of names) {
          if (name.includes('workbox') || name.includes('precache')) {
            caches.delete(name);
          }
        }
      });
    }
  } else {
    // In production, safely register service worker for offline capability
    import('virtual:pwa-register')
      .then(({ registerSW }) => {
        registerSW({
          immediate: true,
          onRegistered(r) {
            if (r) {
              setInterval(() => {
                r.update();
              }, 60 * 60 * 1000);
            }
          },
          onRegisterError(err) {
            console.warn('Service worker registration failed:', err);
          },
        });
      })
      .catch((err) => {
        console.warn('PWA register module failed to load:', err);
      });
  }
}

