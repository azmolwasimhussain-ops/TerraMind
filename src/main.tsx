console.log('[TerraMind] main.tsx script evaluated');

window.addEventListener('error', (e) => {
  console.error('[TerraMind Global Error]', e.error || e.message, e.filename, e.lineno);
  const el = document.getElementById('root');
  if (el && !el.children.length) {
    el.innerHTML = `<div style="padding:2rem;font-family:system-ui;color:#991b1b;background:#fef2f2;border:1px solid #fecaca;margin:2rem;border-radius:0.75rem;">
      <h2 style="font-weight:700;font-size:1.25rem;margin-bottom:0.5rem;">TerraMind Startup Exception</h2>
      <p style="margin-bottom:1rem;color:#7f1d1d;">${e.message || 'Unknown error'}</p>
      <pre style="background:#fff;padding:1rem;border-radius:0.5rem;overflow:auto;font-size:0.875rem;">${e.error?.stack || e.filename + ':' + e.lineno}</pre>
    </div>`;
  }
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('[TerraMind Unhandled Rejection]', e.reason);
});

import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootEl = document.getElementById('root');
console.log('[TerraMind] root element found:', Boolean(rootEl));

if (rootEl) {
  try {
    const root = createRoot(rootEl);
    root.render(<App />);
    console.log('[TerraMind] root.render(<App />) executed');
  } catch (err: any) {
    console.error('[TerraMind] createRoot / render exception:', err);
    rootEl.innerHTML = `<div style="padding:2rem;font-family:system-ui;color:#991b1b;background:#fef2f2;border:1px solid #fecaca;margin:2rem;border-radius:0.75rem;">
      <h2 style="font-weight:700;font-size:1.25rem;margin-bottom:0.5rem;">TerraMind Mounting Exception</h2>
      <pre style="background:#fff;padding:1rem;border-radius:0.5rem;overflow:auto;font-size:0.875rem;">${err?.stack || err}</pre>
    </div>`;
  }
} else {
  console.error('[TerraMind] Could not find #root element in document.');
}

