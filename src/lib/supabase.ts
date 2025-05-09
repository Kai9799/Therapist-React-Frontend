import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { clerkInstance } from './clerk'; // Adjust the path based on your project structure

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are missing');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const fetchClerkOrganizations = async (): Promise<any[]> => {
  try {
    const user = clerkInstance.user;
    if (!user) {
      throw new Error('No authenticated user found');
    }

    const organizations = await user.or();
    if (organizations.length === 0) {
      throw new Error('No organizations found for the current user');
    }

    return organizations;
  } catch (error) {
    console.error('Error fetching organizations from Clerk:', error);
    throw new Error('Failed to fetch organizations from Clerk');
  }
};

export const createClerkSupabaseClient = async () => {
  try {
    const session = clerkInstance.session;
    if (!session || session.status !== 'active') {
      throw new Error('No active authenticated session found');
    }

    const token = await session.getToken({
      template: 'supabase',
      skipCache: true,
    }).catch((error) => {
      console.error('Error getting Supabase token from Clerk:', error);
      throw new Error('Failed to retrieve Supabase token');
    });

    if (!token) {
      throw new Error('No Supabase token available');
    }

    const organizations = await fetchClerkOrganizations();
    const organization = organizations[0];

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
