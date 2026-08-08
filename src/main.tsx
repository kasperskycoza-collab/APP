/// <reference types="vite-plugin-pwa/client" />
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Register the PWA service worker safely to handle offline capabilities
try {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      onNeedRefresh() {
        console.log('App update available');
      },
      onOfflineReady() {
        console.log('App is ready for offline use');
      },
    });
  }).catch((err) => {
    console.warn('PWA service worker registration skipped or failed:', err);
  });
} catch (err) {
  console.warn('PWA service worker initialization error:', err);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

