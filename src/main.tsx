import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './components/App';
import { AccountsRoot } from './components/AccountsRoot';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import './styles/index.css';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
createRoot(document.getElementById('app')!).render(
  <StrictMode><AppErrorBoundary>{publishableKey ? <AccountsRoot publishableKey={publishableKey} /> : <App />}</AppErrorBoundary></StrictMode>,
);
