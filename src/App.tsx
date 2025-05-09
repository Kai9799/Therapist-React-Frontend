import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { TherapistDashboard } from './components/TherapistDashboard';
import { SessionPlanner } from './components/SessionPlanner';
import { ResourceGenerator } from './components/ResourceGenerator';
import { ResourceLibrary } from './components/ResourceLibrary';
import { ClientProfiles2 } from './components/ClientProfiles2';
import { LandingPage } from './pages/LandingPage';
import { DashboardLayout } from './components/Layout';
import { withAuth } from './middleware/auth';
import { AuthProvider } from './contexts/AuthContext';
import { ClientProvider } from './contexts/ClientContext';
import { SignInPage } from './pages/auth/SignInPage';
import { CompanySignupPage } from './pages/auth/CompanySignupPage';
import SuccessPage from './pages/stripe/success';
import CancelPage from './pages/stripe/cancel';
import { JoinOrganizationPage } from './pages/auth/JoinOrganizationPage';
import { SignUpPage } from './pages/auth/SignupPage';
import { CreateOrganizationPage } from './pages/auth/CreateOrganization';
import PricingPage from './components/pricing/PricingPage';
import { useSubscriptionStore } from './stores/useSubscriptionStore';
import { useUser } from '@clerk/clerk-react';

const DashboardContent = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('dashboard');
  const isOrgAdmin = false;

  const handleNavigate = (view: string) => {

    setActiveView(view);
    switch (view) {
      case 'planner':
        navigate('/app/planner');
        break;
      case 'clients':
        navigate('/app/clients');
        break;
      case 'resourceGenerator':
        navigate('/app/resource-generator');
        break;
      case 'resourceLibrary':
        navigate('/app/resource-library');
        break;
      default:
        navigate('/app');
    }
  };

  return (
    <ClientProvider>
      <DashboardLayout activeView={activeView} onNavigate={handleNavigate} isOrgAdmin={isOrgAdmin}>
        {activeView === 'dashboard' && <TherapistDashboard onNavigate={handleNavigate} />}
        {activeView === 'planner' && <SessionPlanner />}
        {activeView === 'clients' && <ClientProfiles2 />}
        {activeView === 'resourceGenerator' && <ResourceGenerator />}
        {activeView === 'resourceLibrary' && <ResourceLibrary />}
      </DashboardLayout>
    </ClientProvider>
  );
};

const ProtectedDashboard = withAuth(DashboardContent);

const App = () => {

  const InitSubscriptionState = () => {
    const { user } = useUser();
    const setSubscriptionData = useSubscriptionStore((s) => s.setSubscriptionData);

    useEffect(() => {
      if (user?.publicMetadata) {
        const metadata = user.publicMetadata as any;
        const status = metadata.subscriptionStatus;
        const isValid = status === 'active' || status === 'trialing';

        setSubscriptionData({
          isSubscribed: isValid,
          isOnTrial: metadata.isOnTrial ?? false,
          subscriptionStatus: status ?? null,
          trialEndsAt: metadata.trialEndsAt,
        });
      }
    }, [user]);

    return null;
  };

  return (
    <BrowserRouter>
      <AuthProvider>
        <InitSubscriptionState />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/create-organization" element={<CreateOrganizationPage />} />
          <Route path="/stripe/success" element={<SuccessPage />} />
          <Route path="/stripe/cancel" element={<CancelPage />} />
          <Route path="/pricing" element={<PricingPage />} />

          <Route path="/signup/company" element={<CompanySignupPage />} />
          <Route path="/join-organization" element={<JoinOrganizationPage />} />


          {/* Protected dashboard */}
          <Route path="/app/*" element={<ProtectedDashboard />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
