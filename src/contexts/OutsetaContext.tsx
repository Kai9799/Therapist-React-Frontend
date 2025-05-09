import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';

interface OutsetaContextType {
  outsetaId: string | null;
  setOutsetaId: (id: string | null) => void;
  supabase: ReturnType<typeof getSupabaseClient>;
  updateSupabaseAuth: (jwt: string) => void;
}

const OutsetaContext = createContext<OutsetaContextType | undefined>(undefined);

export const useOutseta = () => {
  const context = useContext(OutsetaContext);
  if (!context) {
    throw new Error('useOutseta must be used within an OutsetaProvider');
  }
  return context;
};

export const OutsetaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [outsetaId, setOutsetaId] = useState<string | null>(null);
  const [supabase, setSupabase] = useState(() => getSupabaseClient());
  const [jwt, setJwt] = useState<string | null>(null);

  const updateSupabaseAuth = async (jwt: string) => {
    setJwt(jwt);

    try {
      if (!jwt) {
        throw new Error('No JWT token provided');
      }

      // Create new Supabase client with custom headers
      const newClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false
          },
          global: {
            headers: {
              'Authorization': `Bearer ${jwt}`,
              'x-outseta-id': jwt.split('.')[1] // Use JWT payload as Outseta ID
            }
          }
        }
      );

      // Verify the client is properly authenticated
      const { data: { user }, error: authError } = await newClient.auth.getUser();
      if (authError) throw authError;

      setSupabase(newClient);
    } catch (err) {
      console.error('Error updating Supabase auth:', err);
      throw err;
    }
  };

  // Update Supabase client when Outseta ID changes
  useEffect(() => {
    setSupabase(getSupabaseClient(outsetaId));
  }, [outsetaId]);

  return (
    <OutsetaContext.Provider value={{ outsetaId, setOutsetaId, supabase, updateSupabaseAuth }}>
      {children}
    </OutsetaContext.Provider>
  );
};