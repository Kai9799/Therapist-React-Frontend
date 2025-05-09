import { Brain } from 'lucide-react';
import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-white">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center">
                        <Brain className="h-8 w-8 text-indigo-600" />
                        <span className="ml-2 text-xl font-bold text-gray-900">TheraPlan</span>
                    </div>
                    <p className="text-gray-500 text-sm">© 2025 TheraPlan. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;