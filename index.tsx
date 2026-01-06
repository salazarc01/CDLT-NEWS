
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Polyfill seguro para entornos de navegador donde 'process' no está definido globalmente
// Solo lo definimos si realmente no existe para evitar romper inyecciones de Vercel/Vite
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { env: {} };
} else if (!(window as any).process.env) {
  (window as any).process.env = {};
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
