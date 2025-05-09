import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { CompanySignupForm } from '../../components/auth/CompanySignupForm';

export const CompanySignupPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AuthLayout
      title="Create Company Account"
      subtitle="Choose your plan and create your organization account"
    >
      <CompanySignupForm
        onSuccess={() => navigate('/app')}
        onSignIn={() => navigate('/login')}
      />
    </AuthLayout>
  );
};