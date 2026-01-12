// ============================================
// CRITICAL FIX: wp.i18n shim BEFORE React loads
// Prevents Tutor LMS errors from breaking React
// ============================================
if (typeof window !== 'undefined') {
  window.wp = window.wp || {};
  if (!window.wp.i18n) {
    window.wp.i18n = {
      __: (s) => s,
      _x: (s) => s,
      _n: (s) => s,
      _nx: (s) => s,
      sprintf: (s, ...args) => s,
      setLocaleData: () => { },
      getLocaleData: () => ({}),
    };
    console.log('[WK] wp.i18n shim installed');
  }
}

import React from "react";
import ReactDOM from "react-dom/client";

import App from './App.jsx';
import './index.css';

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
