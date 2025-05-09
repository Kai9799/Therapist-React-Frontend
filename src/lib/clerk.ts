import { Clerk } from '@clerk/clerk-js'

const isProduction = typeof window !== 'undefined' && window.location.hostname.includes('theraplan.io');

export const clerkPublishableKey = isProduction
  ? import.meta.env.VITE_CLERK_PROD_PUBLISHABLE_KEY
  : import.meta.env.VITE_CLERK_DEV_PUBLISHABLE_KEY;

export const clerkFrontendApi = isProduction
  ? import.meta.env.VITE_CLERK_PROD_FRONTEND_API
  : import.meta.env.VITE_CLERK_DEV_FRONTEND_API;


export const clerkInstance = new Clerk(clerkPublishableKey)