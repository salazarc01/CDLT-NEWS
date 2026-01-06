
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Polyfill para evitar que la app explote en Vercel si process no está definido
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { env: { API_KEY: '' } };
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
