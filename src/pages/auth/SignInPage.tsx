import React, { useEffect } from 'react';
import { SignIn } from '@clerk/clerk-react';
import { AuthLayout } from '../../components/auth/AuthLayout';

export const SignInPage = () => {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your account"
      showBackButton={true}
    >
      <SignIn
        routing="path"
        path="/sign-in"
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