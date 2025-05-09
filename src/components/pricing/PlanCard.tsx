import React, { useState } from 'react';
import { SignInButton, useAuth, useUser } from '@clerk/clerk-react';
import { CheckCircle } from 'lucide-react';
import { Plan } from '../../types/Plan';

interface PlanCardProps {
    plan: Plan;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan }) => {
    const { isSignedIn, user } = useUser();
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [quantity, setQuantity] = useState(1);

    const handleCheckout = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const userId = user?.id;
            const serverUrl = import.meta.env.VITE_SERVER_URL;
            const res = await fetch(`${serverUrl}/billing/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    priceId: plan.id,
                    quantity: quantity,
                    userId: userId,
                }),
            });

            const response = await res.json();
            if (response?.data?.url) window.location.href = response.data?.url;
        } catch (error) {
            console.error('Checkout failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`rounded-lg shadow-sm p-6 bg-white ${plan.highlight ? 'border-2 border-indigo-500 relative' : 'border border-gray-200'}`}>
            {plan.highlight && (
                <div className="absolute top-0 right-0 -translate-y-1/2 px-3 py-1 bg-indigo-500 text-white text-sm font-medium rounded-full">
                    Popular
                </div>
            )}
            <h3 className="text-lg font-medium text-gray-900 text-center">{plan.name}</h3>
            <p className="mt-4 text-sm text-gray-500 text-center">{plan.description}</p>
            <p className="mt-8 text-center">
                <span className="text-sm font-medium text-gray-500">{plan.isTiered ? 'Starting at ' : ''}</span>
                <span className="text-4xl font-extrabold text-gray-900">{plan.price !== null ? `$${plan.price}` : '—'}</span>
                <span className="text-base font-medium text-gray-500">{plan.isTiered ? '/mo/seat' : '/month'}</span>
            </p>

            {plan.isTiered && (
                <div className="mt-6 flex justify-center items-center space-x-4">
                    <label className="text-sm text-gray-500">Seats:</label>
                    <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10)))}
                        min={1}
                        className="w-16 text-center border border-gray-300 rounded-lg"
                    />
                </div>
            )}

            <ul className="mt-6 space-y-4">
                {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="ml-3 text-sm text-gray-500">{feature}</span>
                    </li>
                ))}
            </ul>

            {isSignedIn ? (
                <button
                    onClick={handleCheckout}
                    className="mt-8 block w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                    disabled={loading}
                >
                    {loading ? (
                        <div className="animate-spin w-5 h-5 mx-auto border-4 border-t-transparent border-white rounded-full"></div>
                    ) : (
                        plan.cta
                    )}
                </button>
            ) : (
                <SignInButton mode="modal">
                    <button className="mt-8 block w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                        {plan.cta}
                    </button>
                </SignInButton>
            )}
        </div>
    );
};

export default PlanCard;
