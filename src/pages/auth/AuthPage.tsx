import React, { useState, useEffect } from 'react';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { LoginForm } from '../../components/auth/LoginForm';
import { SignUpForm } from '../../components/auth/SignUpForm';
import { ForgotPasswordForm } from '../../components/auth/ForgotPasswordForm';
import { useNavigate, Link } from 'react-router-dom';

type AuthView = 'login' | 'signup' | 'forgot-password';

interface AuthPageProps {
  view?: AuthView;
}

export const AuthPage: React.FC<AuthPageProps> = ({ view: initialView = 'login' }) => {
  const [view, setView] = useState<AuthView>('login');
  const navigate = useNavigate();

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  const handleAuthSuccess = () => {
    navigate('/app', { replace: true });
  };

  const getAuthContent = () => {
    switch (view) {
      case 'signup':
        return (
          <AuthLayout
            title="Create your account"
            subtitle={
              <>
                Start managing your therapy practice
                <div className="mt-2">
                  <Link
                    to="/signup/company"
                    className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Looking to create a company account?
                    <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </>
            }
            showBackButton={true}
          >
            <SignUpForm
              onSuccess={handleAuthSuccess}
              onSignIn={() => setView('login')}
              onCompanySignup={() => navigate('/signup/company')}
            />
          </AuthLayout>
        );

      case 'forgot-password':
        return (
          <AuthLayout
            title="Reset your password"
            subtitle="We'll send you instructions to reset your password"
            showBackButton={true}
          >
            <ForgotPasswordForm
              onBack={() => setView('login')}
            />
          </AuthLayout>
        );

      default:
        return (
          <AuthLayout
            title="Welcome back"
            subtitle="Sign in to your account"
            showBackButton={true}
          >
            <LoginForm
              onSuccess={handleAuthSuccess}
              onForgotPassword={() => setView('forgot-password')}
              onSignUp={() => navigate('/signup')}
            />
          </AuthLayout>
        );
    }
  };

  return getAuthContent();
};