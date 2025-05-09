import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { clerkInstance } from './clerk';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are missing');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const createClerkSupabaseClient = async (
  existingToken?: string
) => {
  try {
    const token = existingToken || await getSupabaseTokenFromSession();

    if (!token) {
      throw new Error('No Supabase token available');
    }

    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch (error) {
    console.error('Error creating authenticated Supabase client:', error);
    throw new Error('Failed to create authenticated Supabase client');
  }
};

const getSupabaseTokenFromSession = async (): Promise<string | null> => {
  const waitForClerkSession = async (
    maxAttempts = 20,
    delayMs = 200
  ): Promise<ReturnType<any> | null> => {
    for (let i = 0; i < maxAttempts; i++) {
      const session = clerkInstance.session;
      if (session !== undefined) {
        return session;
      }
      await new Promise((res) => setTimeout(res, delayMs));
    }
    throw new Error('Clerk session did not become available in time');
  };

  const session = await waitForClerkSession();

  if (!session || session.status !== 'active') {
    throw new Error('No active authenticated session found');
  }

  const token = await session.getToken({
    template: 'supabase',
    skipCache: true,
  });

  return token || null;
};
