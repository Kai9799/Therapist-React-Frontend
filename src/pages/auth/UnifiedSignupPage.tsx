import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Building2, User, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { SignUp, useSignUp } from '@clerk/clerk-react';
import { supabase } from '../../lib/supabase';

export const UnifiedSignupPage: React.FC = () => {
  const [orgName, setOrgName] = useState('');
  const [userType, setUserType] = useState<'solo' | 'organization'>('solo');
  const [seats, setSeats] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp: clerkSignUp, setActive } = useSignUp();

  // const createOrganization = async (userId: string, orgName: string) => {
  //   const { data, error } = await supabase
  //     .rpc('create_organization', {
  //       org_name: orgName || `${fullName}'s Organization`,
  //       seats: seats,
  //       user_id: userId
  //     });

  //   if (error) throw error;
  //   return data;
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (userType === 'organization' && seats < 2) {
        throw new Error('Organizations must have at least 2 seats');
      }

      // Start Clerk signup
      const priceId = userType === 'organization'
        ? 'price_1R9azkCpV9qVbHgQydaJnohw' // Organization plan price ID
        : 'price_1R772wCpV9qVbHgQih30ukI2'; // Solo plan price ID

      if (!clerkSignUp) {
        throw new Error('Signup not initialized');
      }

      // Create the user with Clerk
      await clerkSignUp.create({
        emailAddress: email,
        password,
        firstName: fullName.split(' ')[0],
        lastName: fullName.split(' ').slice(1).join(' '),
        unsafeMetadata: {
          userType,
          orgName: userType === 'organization' ? orgName : undefined,
          seats: userType === 'organization' ? seats : undefined
        }
      });

      // Prepare session
      await clerkSignUp.prepareEmailAddressVerification({ strategy: "email_code" });

      // Create Stripe checkout session
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/onboarding`,
          cancelUrl: `${window.location.origin}/signup`,
          metadata: {
            userType,
            orgName: userType === 'organization' ? orgName : undefined,
            seats: userType === 'organization' ? seats : undefined
          }
        })
      });

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (err) {
      console.error('Error signing up:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const plans = {
    basic: {
      name: 'Basic',
      price: '$29',
      features: [
        'Up to 20 clients',
        'Basic session planning',
        'Limited resource generation',
        'Standard note taking'
      ]
    },
    premium: {
      name: 'Premium',
      price: '$49',
      features: [
        'Unlimited clients',
        'Advanced AI session planning',
        'Unlimited resource generation',
        'Voice-to-text note taking',
        'Priority support'
      ],
      popular: true
    },
    professional: {
      name: 'Professional',
      price: '$79',
      features: [
        'Everything in Premium',
        'Multi-user practice',
        'Advanced analytics',
        'Custom branding',
        'API access',
        'Dedicated support'
      ]
    }
  };
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start managing your therapy practice"
    >
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
            <AlertCircle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Account Type Selection */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setUserType('solo')}
            className={`p-4 rounded-lg border-2 text-left transition-colors ${userType === 'solo'
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-200 hover:border-indigo-200'
              }`}
          >
            <div className="flex items-center mb-2">
              <User className="w-5 h-5 text-indigo-600 mr-2" />
              <h3 className="font-medium">Solo Therapist</h3>
            </div>
            <p className="text-sm text-gray-500">
              For individual practitioners managing their own practice
            </p>
          </button>

          <button
            type="button"
            onClick={() => setUserType('organization')}
            className={`p-4 rounded-lg border-2 text-left transition-colors ${userType === 'organization'
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-200 hover:border-indigo-200'
              }`}
          >
            <div className="flex items-center mb-2">
              <Users className="w-5 h-5 text-indigo-600 mr-2" />
              <h3 className="font-medium">Organization</h3>
            </div>
            <p className="text-sm text-gray-500">
              For practices with multiple therapists or team members
            </p>
          </button>
        </div>

        {userType === 'organization' && (
          <div>
            <label htmlFor="seats" className="block text-sm font-medium text-gray-700 mb-1">
              Number of Team Seats
            </label>
            <input
              id="seats"
              type="number"
              min={2}
              value={seats}
              onChange={(e) => setSeats(parseInt(e.target.value))}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Minimum 2 seats required for organizations
            </p>
          </div>
        )}

        {/* Account Type Selection */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setUserType('solo')}
            className={`p-4 rounded-lg border-2 text-left transition-colors ${userType === 'solo'
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-200 hover:border-indigo-200'
              }`}
          >
            <div className="flex items-center mb-2">
              <User className="w-5 h-5 text-indigo-600 mr-2" />
              <h3 className="font-medium">Solo Therapist</h3>
            </div>
            <p className="text-sm text-gray-500">
              For individual practitioners managing their own practice
            </p>
          </button>

          <button
            type="button"
            onClick={() => setUserType('organization')}
            className={`p-4 rounded-lg border-2 text-left transition-colors ${userType === 'organization'
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-200 hover:border-indigo-200'
              }`}
          >
            <div className="flex items-center mb-2">
              <Users className="w-5 h-5 text-indigo-600 mr-2" />
              <h3 className="font-medium">Organization</h3>
            </div>
            <p className="text-sm text-gray-500">
              For practices with multiple therapists or team members
            </p>
          </button>
        </div>

        {userType === 'organization' && (
          <div>
            <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-1">
              Organization Name
            </label>
            <input
              id="orgName"
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder={fullName ? `${fullName}'s Organization` : 'Organization Name'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {userType === 'organization' && (
            <div>
              <label htmlFor="seats" className="block text-sm font-medium text-gray-700 mb-1">
                Number of Team Seats
              </label>
              <input
                id="seats"
                type="number"
                min={2}
                value={seats}
                onChange={(e) => setSeats(parseInt(e.target.value))}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Minimum 2 seats required for organizations
              </p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex flex-col items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
        >
          <span>{loading ? 'Creating Account...' : 'Continue to Payment'}</span>
          <span className="text-xs opacity-75 mt-1">14-day free trial - Cancel anytime</span>
        </button>

        <div className="text-sm text-center">
          <span className="text-gray-600">Already have an account?</span>{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Sign in
          </button>
        </div>
      </div>

      <SignUp
        routing="path"
        path="/sign-up"
        redirectUrl="/app"
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "w-full bg-white shadow-none p-0",
            headerTitle: "text-2xl font-bold text-gray-900",
            headerSubtitle: "text-gray-500",
            formButtonPrimary:
              "w-full bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700",
            formFieldInput:
              "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500",
            dividerLine: "bg-gray-200",
            dividerText: "text-gray-500 bg-white px-2",
            footerActionLink: "text-indigo-600 hover:text-indigo-700"
          }
        }}
      />
    </AuthLayout>
  );
};