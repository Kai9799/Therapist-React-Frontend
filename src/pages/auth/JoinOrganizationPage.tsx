import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { createClerkSupabaseClient } from '../../lib/supabase';

export const JoinOrganizationPage: React.FC = () => {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {

      const supabase = await createClerkSupabaseClient();
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select('*');

      if (error) {
        console.error('Error fetching organizations:', error);
      } else {
        console.log('All organizations:', orgs);
      }


      // First verify the join code
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('join_code', joinCode)
        .single();

      if (orgError || !org) {
        throw new Error('Invalid organization code');
      }

      // Create the user account
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            organization_role: 'member'
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!user) throw new Error('Failed to create user account');

      // Create user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert({
          auth_id: user.id,
          email,
          full_name: fullName,
          organization_id: org.id,
          subscription_tier: 'team',
          subscription_status: 'active',
          role: 'therapist',
          settings: {
            theme: 'light',
            notifications: {
              email: true,
              session_reminders: true
            }
          }
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Add user as organization member
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: profile.id,
          role: 'member'
        });

      if (memberError) throw memberError;

      // Navigate to app
      navigate('/app');

    } catch (err) {
      console.error('Error joining organization:', err);
      setError(err instanceof Error ? err.message : 'Failed to join organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Join Organization"
      subtitle="Sign up with your organization code"
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
            <AlertCircle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="joinCode" className="block text-sm font-medium text-gray-700 mb-1">
            Organization Code
          </label>
          <input
            id="joinCode"
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            required
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

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
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Joining...' : 'Join Organization'}
        </button>
      </form>
    </AuthLayout>
  );
};