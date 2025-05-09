import React from 'react';
import Pricing from '../Pricing';
import FullPageLayout from '../layout/FullPageLayout';

const PricingPage: React.FC = () => {
    return (
        <FullPageLayout
            title="Pricing Plans"
            subtitle="Choose the plan that fits your needs"
            showBackButton
        >
            <Pricing />
        </FullPageLayout>
    );
};

export default PricingPage;
