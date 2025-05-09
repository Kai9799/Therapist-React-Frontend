import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '../lib/supabase';

const isDev = import.meta.env.MODE === 'development';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  subscription_tier: string;
  subscription_status: string;
  subscription_seats: number;
  trial_start?: string;
  trial_end?: string;
  settings: any;
}

export interface AuthContextType {
  isLoggedIn: boolean;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, isSignedIn } = useUser();
  const { user } = useUser();
  const clerk = useClerk();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(!isLoaded);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(isSignedIn || false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (isLoaded && user) {
          // Get Supabase JWT token from Clerk
          const token = await clerk.session?.getToken({ template: 'supabase' });
          if (!token) {
            setError('Authentication token not available');
            setLoading(false);
            return;
          }

          // Create Supabase client with token
          const supabase = await createClerkSupabaseClient();

          // Set profile data
          setProfile({
            id: user.id,
            email: user.emailAddresses[0].emailAddress,
            full_name: `${user.firstName} ${user.lastName}`,
            subscription_tier: 'basic',
            subscription_status: 'active',
            subscription_seats: 1,
            settings: {},
          });

          setIsLoggedIn(true);
          setLoading(false);
        } else if (isLoaded && !user) {
          setProfile(null);
          setIsLoggedIn(false);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize auth');
        setLoading(false);
      }
    };

    initializeAuth();
  }, [isLoaded, user, clerk.session]);

  useEffect(() => {
    const setupAuthListener = async () => {
      if (!user) return;

      try {
        const supabase = await createClerkSupabaseClient();
        
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event: string, session: any) => {
            if (event === 'SIGNED_IN' && session?.user) {
              setIsLoggedIn(true);
            } else if (event === 'SIGNED_OUT') {
              setIsLoggedIn(false);
              setProfile(null);
            }
          }
        );

        return () => {
          subscription.unsubscribe();
        }
      } catch (err) {
        console.error('Error setting up auth listener:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize auth');
      }
    };

    setupAuthListener();
  }, [user]);

  return (
    <AuthContext.Provider value={{
      isLoggedIn,
      profile,
      loading,
      error
    }}>
      {children}
    </AuthContext.Provider>
  );
};