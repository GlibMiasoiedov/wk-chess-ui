import React from "react";
import ReactDOM from "react-dom/client";
import App from './App.jsx';
import './index.css';

// SHIM: Fix for Tutor LMS / WordPress scripts expecting wp.i18n to exist
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
