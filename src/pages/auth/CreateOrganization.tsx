import React, { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { AlertCircle } from 'lucide-react';
import { useUserStore } from '../../stores/useUserStore';

export const CreateOrganizationPage: React.FC = () => {
    const navigate = useNavigate();
    const { getToken, isSignedIn } = useAuth();
    const { user } = useUser();
    const updateUser = useUserStore((state: any) => state.updateUser);

    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleCreateOrganization = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const token = await getToken();
            const serverUrl = import.meta.env.VITE_SERVER_URL;

            const res = await axios.post(
                `${serverUrl}/organizations`,
                { name, clerkUserId: user?.id },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.status === 'success') {
                const { id, clerk_id, name, created_by } = res.data.data;
                updateUser({
                    organizationId: clerk_id,
                    organizationName: name,
                });
                navigate('/pricing');
            } else {
                setError(res.data.message);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isSignedIn === false) {
            navigate('/signup');
        }
    }, [isSignedIn, navigate]);

    return (
        <AuthLayout
            title="Create your organization"
            subtitle="Give your practice a name to get started"
            showBackButton
        >
            <form onSubmit={handleCreateOrganization} className="space-y-6 w-full max-w-md">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
                        <AlertCircle size={20} className="mr-2 mt-0.5" />
                        <p>{error}</p>
                    </div>
                )}

                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Organization Name
                    </label>
                    <input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                    {loading ? 'Creating Organization…' : 'Create Organization'}
                </button>
            </form>
        </AuthLayout>
    );
};
