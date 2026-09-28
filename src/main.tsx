import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker for offline capability and background precache
registerSW({
  immediate: true,
  onRegistered(r) {
    if (r) {
      // Periodically check for updates
      setInterval(() => {
        r.update();
      }, 60 * 60 * 1000); // 1 hour
    }
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
