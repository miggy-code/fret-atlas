import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AccountApp } from '../src/components/AccountApp';
import '../src/styles/index.css';
const userId = new URLSearchParams(location.search).get('user') || 'user_a';
const token = `e30.${btoa(JSON.stringify({ sub: new URLSearchParams(location.search).get('tokenUser') || userId }))}.signature`;
createRoot(document.getElementById('app')!).render(<StrictMode><AccountApp userId={userId} getToken={async () => token} syncUrl="https://sync.test" syncKey="public-test-key" showAccount={false} /></StrictMode>);
