import React, { useEffect, useState } from 'react';
import { useSignIn, useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { AlertCircle } from 'lucide-react';
import { useUserStore } from '../../stores/useUserStore';

export const SignInPage: React.FC = () => {
  const { signIn, setActive, isLoaded: signInLoaded } = useSignIn();
  const { getToken } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const navigate = useNavigate();
  const setUserStore = useUserStore((state) => state.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (userLoaded && user) {
      (async () => {
        try {
          const token = await getToken();
          if (!token) throw new Error('No Supabase token returned from Clerk');

          const accountType = user.unsafeMetadata?.accountType as 'solo' | 'organization';

          setUserStore({
            id: user.id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.emailAddresses[0]?.emailAddress || '',
            username: user.username || '',
            clerkId: user.id,
            supabaseToken: token,
            accountType,
          });

          if (accountType === 'organization') {
            navigate('/app');
          } else {
            navigate('/app');
          }
        } catch (err) {
          console.error('Error syncing user to Supabase:', err);
          setError('Error syncing user to Supabase');
        }
      })();
    }
  }, [user, userLoaded, getToken, navigate, setUserStore]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!signInLoaded || !signIn) throw new Error('Sign-in not ready');

      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
      } else {
        setError('Sign-in not complete');
      }
    } catch (err: any) {
      const message =
        err.errors?.[0]?.longMessage || err.message || 'Sign-in failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!signInLoaded || !signIn) return;

    setGoogleLoading(true);
    setError(null);

    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: window.location.origin + '/sso-callback',
        redirectUrlComplete: window.location.origin + '/app',
      });
    } catch (err: any) {
      console.error('Google Sign-in failed', err);
      setError('Google sign-in failed');
      setGoogleLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your account" showBackButton>
      <>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start mb-4">
            <AlertCircle size={20} className="mr-2 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full py-2 px-4 border border-gray-300 bg-white text-gray-800 rounded-md hover:bg-gray-50 flex justify-center items-center space-x-2"
        >
          {googleLoading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-gray-600 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                ></path>
              </svg>
              Redirecting…
            </>
          ) : (
            <>
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                className="w-5 h-5"
              />
              <span>Sign in with Google</span>
            </>
          )}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">or sign in with email</span>
          </div>
        </div>

        <form onSubmit={handleSignIn} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                  ></path>
                </svg>
                Signing in…
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </>
    </AuthLayout>
  );
};
