
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Polyfill definitivo para Vercel/Producción
(function() {
  if (typeof window !== 'undefined') {
    if (!(window as any).process) {
      (window as any).process = { env: { API_KEY: '' } };
    } else if (!(window as any).process.env) {
      (window as any).process.env = {};
    }
    // Aseguramos que API_KEY exista como string al menos
    (window as any).process.env.API_KEY = (window as any).process.env.API_KEY || '';
  }
})();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("CDLT NEW: No se encontró el elemento raíz");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
