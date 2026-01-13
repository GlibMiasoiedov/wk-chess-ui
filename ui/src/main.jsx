import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

const MOUNT_IDS = ['wk-react-root', 'wk-root', 'root'];

const mountApp = () => {
  let mountPoint = null;

  for (const id of MOUNT_IDS) {
    const el = document.getElementById(id);
    if (el) {
      mountPoint = el;
      break;
    }
  }

  if (mountPoint) {
    console.log(`[WK-UI] Mounting to #${mountPoint.id}`);
    const root = createRoot(mountPoint);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } else {
    setTimeout(mountApp, 500);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}
