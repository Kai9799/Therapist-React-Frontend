import React, { useEffect, useState } from 'react';
import { useSignUp, useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { AlertCircle, Info } from 'lucide-react';
import { useSyncUserToSupabase } from '../../hooks/useSyncUserToSupabase';
import { useUserStore } from '../../stores/useUserStore';

export const SignUpPage: React.FC = () => { 
  const navigate = useNavigate();
  const { isLoaded: signUpLoaded, signUp, setActive } = useSignUp();
  const { isSignedIn, getToken } = useAuth();
  const { user, isLoaded } = useUser(); 

  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [accountType, setAccountType] = useState<'solo' | 'organization'>('solo');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null); 
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [redirectOnSignIn, setRedirectOnSignIn] = useState(true);
  const syncUserToSupabase = useSyncUserToSupabase();
  const setUserStore = useUserStore((state) => state.setUser);

  useEffect(() => {
    if (isSignedIn && redirectOnSignIn) {
      navigate('/');
    }
  }, [isSignedIn, redirectOnSignIn, navigate]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpLoaded || !signUp) return;
    setError(null);
    setLoading(true);

    try {
      await signUp.create({
        firstName,
        lastName,
        username,
        emailAddress: email,
        password,
        unsafeMetadata: { accountType },
      });
      setRedirectOnSignIn(false);
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setStep('verify');
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || 'Sign-up failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      (async () => {
        setSyncing(true);
        try {
          const token = await getToken();

          if (!token) throw new Error('No Supabase token returned from Clerk');

          setUserStore({
            id: user.id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.emailAddresses[0]?.emailAddress || '',
            username: user.username || '',
            clerkId: user.id,
            supabaseToken: token,
            accountType
          });

          await syncUserToSupabase({
            clerkId: user.id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.emailAddresses[0]?.emailAddress || '',
            username: user.username || '',
          });

          navigate(accountType === 'organization' ? '/create-organization' : '/pricing');
        } catch (err) {
          console.error('Error syncing user to Supabase:', err);
          setError('Error syncing user to Supabase');
        } finally {
          setSyncing(false);
        }
      })();
    }
  }, [user, isLoaded]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpLoaded || !signUp || !setActive) return;
    setError(null);
    setLoading(true);

    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code });

      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
      } else {
        setError('Verification incomplete');
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start managing your therapy practice"
      showBackButton
    >
      {syncing && (
        <div className="flex justify-center items-center space-x-2">
          <div className="animate-spin border-t-4 border-blue-600 border-solid rounded-full w-8 h-8"></div>
          <span></span>
        </div>
      )}

      {step === 'form' ? (
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
              <AlertCircle size={20} className="mr-2 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* Custom Sign-Up Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First name
                </label>
                <input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last name
                </label>
                <input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
                className="mt-1 block w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="mt-1 text-sm text-gray-500 flex items-center">
                <Info size={14} className="mr-1" />
                At least 6 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
              <div className="grid grid-cols-2 gap-4">
                <label
                  className={`cursor-pointer p-4 border rounded-md flex flex-col items-start space-y-1 hover:border-indigo-500 ${accountType === 'solo' ? 'border-indigo-600 ring-1 ring-indigo-300 bg-indigo-50' : 'border-gray-300'
                    }`}
                >
                  <input
                    type="radio"
                    name="accountType"
                    value="solo"
                    checked={accountType === 'solo'}
                    onChange={() => setAccountType('solo')}
                    className="sr-only"
                  />
                  <span className="font-medium text-gray-900">Solo Therapist</span>
                  <span className="text-sm text-gray-500">Manage your practice independently</span>
                </label>

                <label
                  className={`cursor-pointer p-4 border rounded-md flex flex-col items-start space-y-1 hover:border-indigo-500 ${accountType === 'organization' ? 'border-indigo-600 ring-1 ring-indigo-300 bg-indigo-50' : 'border-gray-300'
                    }`}
                >
                  <input
                    type="radio"
                    name="accountType"
                    value="organization"
                    checked={accountType === 'organization'}
                    onChange={() => setAccountType('organization')}
                    className="sr-only"
                  />
                  <span className="font-medium text-gray-900">Organization</span>
                  <span className="text-sm text-gray-500">Invite and manage a team of therapists</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              {loading ? 'Creating Account…' : 'Create Account'}
            </button>
          </form>
        </div>
      ) : (
        /* Verification Step */
        <form onSubmit={handleVerify} className="space-y-4">
          <p className="text-gray-700 text-center">
            Check your email for the verification code.
          </p>
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700">
              Verification Code
            </label>
            <input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
              <AlertCircle size={20} className="mr-2 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            {loading ? 'Verifying…' : 'Verify & Continue'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
};
