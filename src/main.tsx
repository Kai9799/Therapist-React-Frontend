import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import { clerkPublishableKey } from './lib/clerk';
import './index.css';

if (!clerkPublishableKey) {
  throw new Error('Missing Clerk Publishable Key');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPublishableKey}>
    <App />
    </ClerkProvider>
  </StrictMode>
);
