import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

const MOUNT_POINT_ID = 'white-knight-chess-app';

const mountApp = () => {
  const mountPoint = document.getElementById(MOUNT_POINT_ID);

  if (mountPoint) {
    try {
      ReactDOM.createRoot(mountPoint).render(
        <React.StrictMode>
          <WhiteKnightApp />
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
