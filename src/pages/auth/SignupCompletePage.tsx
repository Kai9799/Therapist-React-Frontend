import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AuthLayout } from '../../components/auth/AuthLayout';

export const SignupCompletePage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        if (!session?.user) {
          throw new Error('No user found');
        }

        // Clear any pending signup data
        sessionStorage.removeItem('pendingSignup');

        // Wait a moment before redirecting
        setTimeout(() => {
          navigate('/app', { replace: true });
        }, 2000);

      } catch (err) {
        console.error('Error checking user:', err);
        setError(err instanceof Error ? err.message : 'Failed to complete signup');
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [navigate]);

  return (
    <AuthLayout
      title="Welcome to TheraPlan!"
      subtitle="Your account has been created successfully"
      showBackButton={false}
    >
      <div className="text-center">
        {error ? (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
            <AlertCircle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
            <button
              onClick={() => navigate('/signup')}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Signup Successful!
            </h2>
            <p className="text-gray-600">
              {loading ? "Preparing your workspace..." : "Redirecting you to your dashboard..."}
            </p>
          </>
        )}
      </div>
    </AuthLayout>
  );
};