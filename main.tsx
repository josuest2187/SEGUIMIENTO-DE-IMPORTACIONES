import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// @ts-ignore
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker
if (typeof window !== 'undefined') {
  registerSW({
    onNeedRefresh() {
      if (confirm('Nueva versión disponible. ¿Desea actualizar?')) {
        window.location.reload();
      }
    },
    onOfflineReady() {
      console.log('App lista para usar sin conexión');
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
