import React from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Match the IDs used in the WP plugin
const MOUNT_IDS = ['wk-react-root', 'wk-root', 'root'];

const mountApp = () => {
  let mountPoint = null;

  // Try finding the mount point
  for (const id of MOUNT_IDS) {
    const el = document.getElementById(id);
    if (el) {
      mountPoint = el;
      break;
    }
  }

  if (mountPoint) {
    try {
      console.log(`[WK-UI] Found mount point: #${mountPoint.id}`);

      // Robust retrieval of createRoot for various bundle formats
      const createRoot = ReactDOM.createRoot || ReactDOM.default?.createRoot;

      if (typeof createRoot === 'function') {
        const root = createRoot(mountPoint);
        root.render(
          <React.StrictMode>
            <App />
          </React.StrictMode>
        );
        console.log("[WK-UI] React App mounted successfully (createRoot).");
      } else {
        // Fallback or error report
        console.error('[WK-UI] createRoot not found in ReactDOM/client exports:', ReactDOM);
        mountPoint.innerHTML = `<div style="color:red; padding:20px; text-align:center">
          Application Error: ReactDOM.createRoot is undefined.<br/>
          React Version: ${React.version}
        </div>`;
      }
    } catch (error) {
      console.error('[WK-UI] React Mount Error:', error);
      mountPoint.innerHTML = `<div style="color:red; padding:20px; text-align:center">Application Error: ${error.message}</div>`;
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
