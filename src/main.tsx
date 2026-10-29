import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/react';
import { App } from './components/App';
import './studio.css';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
createRoot(document.getElementById('app')!).render(
  <StrictMode>{publishableKey ? <ClerkProvider publishableKey={publishableKey}><App accountsEnabled /></ClerkProvider> : <App />}</StrictMode>,
);
