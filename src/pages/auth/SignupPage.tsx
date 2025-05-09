// src/pages/SignUpPage.tsx
import React, { useState } from 'react';
import { useSignUp, useSignIn } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { AlertCircle, Info } from 'lucide-react';

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { isLoaded: signUpLoaded, signUp, setActive } = useSignUp();
  const { isLoaded: signInLoaded, signIn } = useSignIn();

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

  const handleGoogle = async () => {
    if (!signInLoaded || !signIn || !setActive) return;
    setLoading(true);
    try {
      const { createdSessionId } = await signIn.create({
        strategy: 'oauth_google',
        redirectUrl: `${window.location.origin}${accountType === 'organization' ? '/create-organization' : '/app'}`,
      });
      await setActive({ session: createdSessionId });
      navigate(accountType === 'organization' ? '/create-organization' : '/app');
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || 'Google sign-up failed');
    } finally {
      setLoading(false);
    }
  };

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
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setStep('verify');
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || 'Sign-up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpLoaded || !signUp || !setActive) return;
    setError(null);
    setLoading(true);

    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code });
      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        navigate(accountType === 'organization' ? '/create-organization' : '/pricing');
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
      {step === 'form' ? (
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
              <AlertCircle size={20} className="mr-2 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* Google Button */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium bg-white hover:bg-gray-50"
          >
            {loading ? 'Please wait...' : 'Sign up with Google'}
          </button>

          <div className="relative text-center">
            <span className="px-2 bg-white text-sm text-gray-500">Or continue with</span>
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
          </div>

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
