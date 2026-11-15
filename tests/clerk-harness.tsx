import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AccountsRoot } from '../src/components/AccountsRoot';
import '../src/styles/index.css';
// A well-formed publishable key for a Frontend API host that does not exist, so tests can watch for requests to it.
createRoot(document.getElementById('app')!).render(<StrictMode><AccountsRoot publishableKey="pk_test_Y2xlcmsuZnJldG9yeS10ZXN0LmV4YW1wbGUk" /></StrictMode>);
