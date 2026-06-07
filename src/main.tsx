/// <reference types="vite-plugin-pwa/client" />
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register the PWA service worker to handle offline capabilities
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('App update available');
  },
  onOfflineReady() {
    console.log('App is ready for offline use');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
