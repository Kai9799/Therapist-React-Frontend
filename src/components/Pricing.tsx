import React, { useEffect, useState } from 'react';
import { useUser, useOrganization } from '@clerk/clerk-react';
import { CategorizedPlans } from '../types/CategorizedPlans';
import { Plan } from '../types/Plan';
import PlanCard from './pricing/PlanCard';

const Pricing: React.FC = () => {
    const [plans, setPlans] = useState<CategorizedPlans>({ individual: [], company: [] });
    const [loading, setLoading] = useState<boolean>(true);
    const { isLoaded: userLoaded, user } = useUser();
    const { isLoaded: orgLoaded, organization } = useOrganization();

    const isOrgUser = !!organization || (user?.organizationMemberships?.length ?? 0) > 0;
    const pricingType: 'individual' | 'company' = isOrgUser ? 'company' : 'individual';

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const serverUrl = import.meta.env.VITE_SERVER_URL;
                const res = await fetch(`${serverUrl}/billing/products`);
                const json = await res.json();

                const categorized: CategorizedPlans = { individual: [], company: [] };

                json.data.forEach((product: any) => {
                    product.prices.forEach((price: any) => {
                        try {
                            const features = JSON.parse(price.metadata.features);
                            const firstTierUnitAmount = price.tiers?.[0]?.unit_amount ?? null;

                            const plan: Plan = {
                                id: price.id,
                                name: price.metadata.name,
                                price: price.unit_amount
                                    ? price.unit_amount / 100
                                    : firstTierUnitAmount
                                        ? firstTierUnitAmount / 100
                                        : null,
                                isTiered: !price.unit_amount && !!price.tiers?.length,
                                description: price.metadata.description || '',
                                features,
                                cta: price.metadata.cta,
                                highlight: price.metadata.highlight === 'true',
                            };

                            const isCompanyPlan = /organization|business/i.test(product.name);
                            categorized[isCompanyPlan ? 'company' : 'individual'].push(plan);
                        } catch (e) {
                            console.error(`Failed to parse plan metadata for price ID ${price.id}`, e);
                        }
                    });
                });

                setPlans(categorized);
            } catch (error) {
                console.error('Failed to fetch pricing plans:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPlans();
    }, []);

    if (!userLoaded || !orgLoaded) {
        return (
            <div className="flex justify-center items-center space-x-2 mt-10">
                <div className="animate-spin rounded-full border-t-4 border-indigo-600 w-12 h-12"></div>
                <span className="text-lg text-gray-600">Loading user info...</span>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="lg:text-center">
                    <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase text-center mb-2">Pricing</h2>
                    {/* Only show toggle if user is allowed to pick plan type */}
                    {!isOrgUser && (
                        <div className="flex justify-center mb-8">
                            <div className="bg-gray-100 p-1 rounded-xl inline-flex">
                                {/* Future-proofing for allowing switch manually */}
                                <button
                                    className="px-6 py-2 rounded-lg text-sm font-medium transition-colors bg-white text-gray-900 shadow-sm"
                                    disabled
                                >
                                    Individual
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center items-center space-x-2 mt-10">
                        <div className="animate-spin rounded-full border-t-4 border-indigo-600 w-12 h-12"></div>
                        <span className="text-lg text-gray-600">Loading...</span>
                    </div>
                ) : (
                    <div className="mt-10 space-y-4 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6 lg:max-w-4xl lg:mx-auto">
                        {plans[pricingType].map((plan) => (
                            <PlanCard key={plan.id} plan={plan} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Pricing;
