// Application bootstrap and DOM mounting.
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.js';
import './index.css';

/**
 * Mounts the React root into the provided container.
 *
 * @param container - HTML container element.
 * @returns React root instance.
 */
export function mountApp(container: HTMLElement): ReactDOM.Root {
  const root = ReactDOM.createRoot(container);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  return root;
}

const container = document.getElementById('root');
if (container !== null) {
  mountApp(container);
}
