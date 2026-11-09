import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AccountApp } from '../src/components/AccountApp';
import '../src/styles/index.css';
import type { Edit } from '../src/core/sync-edit';
const userId = new URLSearchParams(location.search).get('user') || 'user_a';
const token = `e30.${btoa(JSON.stringify({ sub: new URLSearchParams(location.search).get('tokenUser') || userId }))}.signature`;
// ?carry=dark stands in for changes made on this device while the account was still loading.
const deviceEdits: Edit | undefined = new URLSearchParams(location.search).get('carry') === 'dark' ? { settings: { theme: 'dark' } } : undefined;
createRoot(document.getElementById('app')!).render(<StrictMode><AccountApp userId={userId} getToken={async () => token} syncUrl="https://sync.test" syncKey="public-test-key" deviceEdits={deviceEdits} /></StrictMode>);
