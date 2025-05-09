import React, { useState } from 'react';
import { AlertCircle, Info, CheckCircle, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface CompanySignupFormProps {
  onSuccess: () => void;
  onSignIn: () => void;
}

const PASSWORD_MIN_LENGTH = 6;

interface CompanyPlan {
  id: string;
  name: string;
  price: string;
  seats: number;
  features: string[];
  isPopular?: boolean;
}

const companyPlans: CompanyPlan[] = [
  {
    id: 'growth',
    name: 'Growth Plan',
    price: '$99',
    seats: 5,
    features: [
      '5 seats (therapists/admins)',
      'Unlimited client profiles',
      'Unlimited session plans',
      'Unlimited resource generation',
      'All resource types',
      'Admin dashboard + basic team analytics'
    ]
  },
  {
    id: 'practice',
    name: 'Practice Plan',
    price: '$199',
    seats: 10,
    features: [
      '10 seats (therapists/admins)',
      'Everything in Growth Plan',
      'Priority support',
      'Advanced team analytics',
      'Custom branding options',
      'Enhanced collaboration tools',
      'Team resource library',
      'Advanced reporting',
      'Training resources',
      'Dedicated account manager'
    ],
    isPopular: true
  },
  {
    id: 'clinic',
    name: 'Clinic Plan',
    price: '$399',
    seats: 20,
    features: [
      '20 seats (therapists/admins)',
      'Everything in Practice Plan',
      'Dedicated onboarding',
      'Custom integrations',
      'Advanced security features',
      'SLA guarantees',
      'Custom workflows',
      'HIPAA compliance support',
      'Audit logs',
      'Advanced permissions',
      'API access'
    ]
  }
];

export const CompanySignupForm: React.FC<CompanySignupFormProps> = ({ onSuccess, onSignIn }) => {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    companyName: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    selectedPlan: 'practice' as string,
    agreeToTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      await signUp(formData.email, formData.password);
      onSuccess();
      
    } catch (err) {
      console.error('Error in company signup:', err);
      setError(err instanceof Error ? err.message : 'Failed to create company account');
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
          <AlertCircle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}
      
      {/* Plan Selection */}
      <div className="space-y-4">
        {companyPlans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
              formData.selectedPlan === plan.id
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-indigo-200'
            }`}
            onClick={() => setFormData(prev => ({ ...prev, selectedPlan: plan.id }))}
          >
            {plan.isPopular && (
              <span className="absolute top-0 right-0 -translate-y-1/2 px-3 py-1 bg-indigo-500 text-white text-xs font-medium rounded-full">
                Popular
              </span>
            )}
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="text-base font-medium text-gray-900">{plan.name}</h4>
                <p className="text-2xl font-bold text-gray-900">{plan.price}
                  <span className="text-sm font-normal text-gray-500">/mo</span>
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                formData.selectedPlan === plan.id ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
              }`}>
                {formData.selectedPlan === plan.id && <CheckCircle className="w-4 h-4 text-white" />}
              </div>
            </div>
            <ul className="space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Company Information */}
      <div>
        <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
          Company Name
        </label>
        <div className="mt-1">
          <input
            id="companyName"
            name="companyName"
            type="text"
            required
            value={formData.companyName}
            onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Admin Information */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
          Your Full Name
        </label>
        <div className="mt-1">
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            value={formData.fullName}
            onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email Address
        </label>
        <div className="mt-1">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <div className="mt-1 space-y-2">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            value={formData.confirmPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            placeholder="Confirm password"
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          <p className="mt-1 text-sm text-gray-500 flex items-center">
            <Info size={14} className="mr-1" />
            Must be at least {PASSWORD_MIN_LENGTH} characters
          </p>
        </div>
      </div>

      <div className="flex items-center">
        <input
          id="agreeToTerms"
          name="agreeToTerms"
          type="checkbox"
          required
          checked={formData.agreeToTerms}
          onChange={(e) => setFormData(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-900">
          I agree to the Terms of Service and Privacy Policy
        </label>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Account...' : 'Create Company Account'}
          <span className="text-xs opacity-75 block mt-1">Free trial - No credit card required</span>
        </button>
      </div>

      <div className="text-sm text-center">
        <span className="text-gray-600">Already have an account?</span>{' '}
        <button
          type="button"
          onClick={onSignIn}
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          Sign in
        </button>
      </div>
    </form>
  );
};