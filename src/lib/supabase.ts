import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { useUserStore } from '../stores/useUserStore';
import { clerkInstance } from './clerk';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are missing');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

const getTokenFromStoreOrFallback = async (): Promise<string | null> => {
  const { supabaseToken } = useUserStore.getState().user || {};

  if (supabaseToken) return supabaseToken;

  const session = clerkInstance.session;

  if (!session || session.status !== 'active') {
    throw new Error('No active session found');
  }

  const token = await session.getToken({
    template: 'supabase',
    skipCache: true,
  });

  return token || null;
};

export const createClerkSupabaseClient = async () => {
  try {
    const token = await getTokenFromStoreOrFallback();

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
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (error) {
    console.error('Error creating authenticated Supabase client:', error);
    throw new Error('Failed to create authenticated Supabase client');
  }
};
