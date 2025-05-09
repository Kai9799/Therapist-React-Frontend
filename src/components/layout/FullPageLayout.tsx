import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FullPageLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
    showBackButton?: boolean;
}

const FullPageLayout: React.FC<FullPageLayoutProps> = ({ children, title, subtitle, showBackButton = true }) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-12">
            {showBackButton && (
                <button
                    onClick={() => navigate('/')}
                    className="mb-4 inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 mr-1" />
                    <span>Back to home</span>
                </button>
            )}

            <div className="max-w-7xl mx-auto text-center">
                <h1 className="text-3xl font-extrabold text-gray-900">{title}</h1>
                {subtitle && <p className="mt-2 text-gray-600">{subtitle}</p>}
            </div>

            <div className="mt-10 max-w-7xl mx-auto">{children}</div>
        </div>
    );
};

export default FullPageLayout;
