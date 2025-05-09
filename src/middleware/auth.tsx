import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { useSubscriptionStore } from '../store/useSubscriptionStore';

export const withAuth = (Component: React.ComponentType) => {
  return () => {
    const { isLoaded, isSignedIn } = useUser();
    const isSubscribed = useSubscriptionStore((s) => s.isSubscribed);

    if (!isLoaded) return null;

    if (!isSignedIn) {
      return <Navigate to="/" replace />;
    }

    if (!isSubscribed) {
      return <Navigate to="/pricing" replace />;
    }

    return <Component />;
  };
};
