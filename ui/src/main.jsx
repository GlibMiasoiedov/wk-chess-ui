import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// CRITICAL SHIM: Fix for Tutor LMS / WordPress i18n errors
if (typeof window !== 'undefined') {
  window.wp = window.wp || {};
  window.wp.i18n = window.wp.i18n || {
    __: (str) => str,
    _x: (str) => str,
    _n: (str) => str,
    sprintf: (...args) => args[0]
  };
  console.log('[WK-UI] wp.i18n shim applied');
}

const rootEl =
  document.getElementById("wk-react-root") ||
  document.getElementById("wk-root") ||
  document.getElementById("root");

if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
