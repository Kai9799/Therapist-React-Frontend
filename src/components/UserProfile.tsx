import React, { useState, useEffect } from 'react';
import { User, CreditCard, Bell, Shield, LogOut, Check, X, HelpCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { AuthLayout } from '../../components/auth/AuthLayout';

export const UserProfile: React.FC = () => {
  const [activeTab, setActiveTab] = useState('account');
  const { signOut, profile } = useAuth();
  
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  
  useEffect(() => {
    if (profile?.organization_id) {
      fetchOrganizationDetails();
    }
  }, [profile]);

  const fetchOrganizationDetails = async () => {
    try {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile!.organization_id)
        .single();

      if (orgError) throw orgError;
      setOrganization(org);

      // Fetch subscription plan details if organization exists
      if (org) {
        const { data: plans, error: planError } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('id', 'clinic'); // Default to clinic plan for organizations

        if (planError) throw planError;
        if (plans && plans.length > 0) {
          setSubscriptionPlan(plans[0]);
        }
      }

    } catch (err) {
      console.error('Error fetching organization details:', err);
      setError('Failed to load organization details');
    }
  };

  const handleJoinOrganization = async () => {
    try {
      setJoinError(null);
      
      // Get organization by join code
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('join_code', joinCode)
        .single();

      if (orgError) throw new Error('Invalid join code');
      if (!org) throw new Error('Organization not found');

      // Add user as member
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: profile!.id,
          role: 'member'
        });

      if (memberError) throw memberError;

      // Update user's organization_id
      const { error: updateError } = await supabase
        .from('users')
        .update({ organization_id: org.id })
        .eq('id', profile!.id);

      if (updateError) throw updateError;

      // Refresh page to update context
      window.location.reload();

    } catch (err) {
      console.error('Error joining organization:', err);
      setJoinError(err instanceof Error ? err.message : 'Failed to join organization');
    }
  };
  
  const userData = profile ? {
    name: profile.full_name,
    email: profile.email,
    profileImage: null,
    plan: profile.subscription_tier,
    nextBillingDate: profile.subscription_end_date,
    paymentMethod: profile.settings?.payment_method || {
      type: 'credit_card',
      last4: '****',
      expiry: 'N/A'
    }
  } : null;
  
  // Mock subscription plans
  const subscriptionPlans = [
    {
      id: 'basic',
      name: 'Basic',
      price: '$29',
      period: 'month',
      features: [
        'Up to 20 clients',
        'Basic session planning',
        'Limited resource generation',
        'Standard note taking'
      ],
      isPopular: false
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$49',
      period: 'month',
      features: [
        'Unlimited clients',
        'Advanced AI session planning',
        'Unlimited resource generation',
        'Voice-to-text note taking',
        'Priority support'
      ],
      isPopular: true
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '$79',
      period: 'month',
      features: [
        'Everything in Premium',
        'Multi-user practice',
        'Advanced analytics',
        'Custom branding',
        'API access',
        'Dedicated support'
      ],
      isPopular: false
    }
  ];
  
  // Mock notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailSummary: true,
    sessionReminders: true,
    productUpdates: false,
    securityAlerts: true
  });
  
  const toggleNotification = (key: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  const renderAccountTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="relative">
          {userData.profileImage ? (
            <img 
              src={userData.profileImage} 
              alt="Profile" 
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-indigo-800 text-2xl font-semibold">
                {userData.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
          )}
          <button className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1.5 rounded-full hover:bg-indigo-700">
            <User size={16} />
          </button>
        </div>
        
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-800">{userData.name}</h2>
          <p className="text-gray-500">{userData.email}</p>
          <div className="mt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {userData.plan.charAt(0).toUpperCase() + userData.plan.slice(1)} Plan
            </span>
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              defaultValue={userData.name}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              defaultValue={userData.email}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              defaultValue="••••••••••••"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
              Timezone
            </label>
            <select
              id="timezone"
              defaultValue="America/New_York"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">Greenwich Mean Time (GMT)</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6">
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
            Save Changes
          </button>
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Account Actions</h3>
        <div className="space-y-3">
          <button className="flex items-center text-gray-700 hover:text-gray-900">
            <Shield size={18} className="mr-2" />
            <span>Two-Factor Authentication</span>
            <span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
              Not Enabled
            </span>
          </button>
          
          <button 
            onClick={signOut}
            className="flex items-center text-red-600 hover:text-red-800"
          >
            <LogOut size={18} className="mr-2" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
      
      {/* Join Organization */}
      {!profile?.organization_id && (
        <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
          <h3 className="text-lg font-medium text-indigo-800 mb-4">Join an Organization</h3>
          {joinError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {joinError}
            </div>
          )}
          <div className="flex space-x-4">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter organization join code"
              className="flex-1 px-4 py-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleJoinOrganization}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Join Organization
            </button>
          </div>
        </div>
      )}
    </div>
  );
  
  const renderSubscriptionTab = () => (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="bg-indigo-50 p-6 rounded-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start">
          <div>
            <h3 className="font-medium text-indigo-800 text-lg">
              {profile?.organization_id ? (
                <>Organization Plan: {subscriptionPlan?.name || 'Loading...'}</>
              ) : (
                <>Current Plan: {userData.plan.charAt(0).toUpperCase() + userData.plan.slice(1)}</>
              )}
            </h3>
            {profile?.organization_id ? (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-indigo-700">
                  <span className="font-medium">Seats:</span> {organization?.seats_used || 0} / {organization?.seats_purchased || 0} used
                </p>
                <p className="text-sm text-indigo-700">
                  <span className="font-medium">Admin Seats:</span> {organization?.admin_count || 0}
                </p>
                <p className="text-sm text-indigo-700">
                  <span className="font-medium">Next Billing:</span> {organization?.current_period_end ? new Date(organization.current_period_end).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-indigo-700">
                  <span className="font-medium">Next Billing:</span> {userData.nextBillingDate}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => {}}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors"
          >
            <span>Manage Subscription</span>
          </button>
        </div>
      </div>
      
      {/* Available Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {subscriptionPlans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-lg border-2 p-6 ${
              plan.id === userData.plan
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-indigo-200'
            }`}
          >
            {plan.isPopular && (
              <span className="absolute top-0 right-0 -translate-y-1/2 px-3 py-1 bg-indigo-500 text-white text-xs font-medium rounded-full">
                Popular
              </span>
            )}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-base font-medium text-gray-900">{plan.name}</h4>
                <p className="text-2xl font-bold text-gray-900 mt-2">{plan.price}
                  <span className="text-sm font-normal text-gray-500">/mo</span>
                </p>
              </div>
            </div>
            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>
            {plan.id === userData.plan ? (
              <div className="text-sm text-indigo-600 font-medium">Current Plan</div>
            ) : (
              <button
                onClick={() => {}}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Upgrade to {plan.name}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
  
  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Email Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">Weekly Summary</p>
              <p className="text-sm text-gray-500">Receive a weekly summary of your activity and client progress</p>
            </div>
            <button 
              onClick={() => toggleNotification('emailSummary')}
              className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                notificationSettings.emailSummary ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span className="sr-only">Toggle notification</span>
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                  notificationSettings.emailSummary ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">Session Reminders</p>
              <p className="text-sm text-gray-500">Get notified about upcoming client sessions</p>
            </div>
            <button 
              onClick={() => toggleNotification('sessionReminders')}
              className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                notificationSettings.sessionReminders ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span className="sr-only">Toggle notification</span>
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                  notificationSettings.sessionReminders ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">Product Updates</p>
              <p className="text-sm text-gray-500">Stay informed about new features and improvements</p>
            </div>
            <button 
              onClick={() => toggleNotification('productUpdates')}
              className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                notificationSettings.productUpdates ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span className="sr-only">Toggle notification</span>
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                  notificationSettings.productUpdates ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">Security Alerts</p>
              <p className="text-sm text-gray-500">Receive notifications about security-related events</p>
            </div>
            <button 
              onClick={() => toggleNotification('securityAlerts')}
              className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                notificationSettings.securityAlerts ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span className="sr-only">Toggle notification</span>
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                  notificationSettings.securityAlerts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="emailFrequency" className="block text-sm font-medium text-gray-700 mb-1">
              Email Frequency
            </label>
            <select
              id="emailFrequency"
              defaultValue="daily"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="realtime">Real-time</option>
              <option value="daily">Daily Digest</option>
              <option value="weekly">Weekly Digest</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <input
              id="unsubscribeAll"
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="unsubscribeAll" className="ml-2 block text-sm text-gray-700">
              Unsubscribe from all marketing emails
            </label>
          </div>
        </div>
        
        <div className="mt-6">
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('account')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'account'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Account
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'subscription'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Subscription & Billing
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'notifications'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Notifications
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'account' && renderAccountTab()}
          {activeTab === 'subscription' && renderSubscriptionTab()}
          {activeTab === 'notifications' && renderNotificationsTab()}
        </div>
      </div>
    </div>
  );
};