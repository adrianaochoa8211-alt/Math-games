import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.jsx';
import './index.css';

console.log("Arcade Vault: Rendering Root...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Critical: 'root' element not found in HTML!");
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
