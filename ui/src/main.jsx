import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// CRITICAL SHIM: Fix for Tutor LMS / WordPress scripts expecting wp.i18n to exist
// This prevents "Cannot destructure property '__' of 'wp.i18n' as it is undefined"
if (typeof window !== 'undefined') {
  window.wp = window.wp || {};
  window.wp.i18n = window.wp.i18n || {
    __: (text, domain) => text,
    _x: (text, context, domain) => text,
    _n: (single, plural, number, domain) => number === 1 ? single : plural,
    _nx: (single, plural, number, context, domain) => number === 1 ? single : plural,
    sprintf: (format, ...args) => {
      let i = 0;
      return format.replace(/%[sdf]/g, () => args[i++] || '');
    }
  };
  console.log('[WK-UI] wp.i18n shim applied');
}

// Match the ID in wk-chess-ui.php
const MOUNT_POINT_ID = 'wk-react-root';

const mountApp = () => {
  const mountPoint = document.getElementById(MOUNT_POINT_ID);

  if (mountPoint) {
    try {
      ReactDOM.createRoot(mountPoint).render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
      console.log("[WK-UI] React App mounted successfully.");
    } catch (error) {
      console.error("[WK-UI] React Mount Error:", error);
      mountPoint.innerHTML = `<div style="color:red; p:20px; text-align:center">Application Error: ${error.message}</div>`;
    }
  } else {
    // Retry if mount point not found yet (common in WP)
    console.log("[WK-UI] Mount point not found, retrying...");
    setTimeout(mountApp, 500);
  }
};

// Ensure DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}
