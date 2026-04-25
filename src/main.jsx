import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Global error listener to catch and report errors that would otherwise result in a blank page
window.addEventListener('error', (e) => {
  console.error("Arcade Vault Init Error:", e.message, e.error);
});

console.log("Arcade Vault: Initializing Archive...");

const mountApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.warn("Retrying root mount...");
    setTimeout(mountApp, 100);
    return;
  }
  
  console.log("Arcade Vault: Root Found. Mounting App.");
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
};

// Start the mount process
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}
