import React, { useEffect } from 'react';
import { CreateOrganization, useOrganization } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';

export const CreateOrganizationPage: React.FC = () => {
    const navigate = useNavigate();
    const { isLoaded, organization } = useOrganization();

    useEffect(() => {
        if (isLoaded && organization) {
            navigate('/pricing');
        }
    }, [isLoaded, organization, navigate]);

    return (
        <AuthLayout
            title="Create your organization"
            subtitle="Give your practice a name to get started"
            showBackButton
        >
            <CreateOrganization
                routing="path"
                path="/create-organization"
                afterCreateOrganizationUrl="/pricing"
                skipInvitationScreen={true}
                appearance={{
                    elements: {
                        rootBox: 'w-full max-w-md',
                        card: 'p-6 shadow-lg rounded-lg',
                        headerTitle: 'text-2xl font-bold text-gray-900',
                        headerSubtitle: 'text-gray-600 mb-4',
                        formFieldInput: 'w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500',
                        formButtonPrimary: 'w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700',
                    }
                }}
            />
        </AuthLayout>
    );
};
