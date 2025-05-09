import React from 'react';

const HowItWorks: React.FC = () => {
    return (
        <div className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="lg:text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl text-center mb-4">
                        How TheraPlan Works in 3 Easy Steps
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-12">
                        Get your session planning completed in minutes, not hours. It's as simple as 1-2-3.
                    </p>
                    <div className="grid grid-cols-1 gap-12 sm:grid-cols-3 relative">
                        <div className="hidden sm:block absolute top-1/2 left-1/4 w-1/2 h-0.5 bg-indigo-100 -translate-y-1/2"></div>
                        <div className="hidden sm:block absolute top-1/2 right-1/4 w-1/2 h-0.5 bg-indigo-100 -translate-y-1/2"></div>
                        {/* Step 1 */}
                        <div className="relative flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl font-bold mb-6">1</div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                                    Select Your Client & Focus Area
                                </h3>
                                <p className="text-gray-600 text-center">
                                    Choose the therapy type, client goals, and session focus in seconds.
                                </p>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="relative flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl font-bold mb-6">2</div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                                    Click "Generate Plan"
                                </h3>
                                <p className="text-gray-600 text-center">
                                    Instantly generate a customized session plan with suggested activities, discussion points, and resources.
                                </p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="relative flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl font-bold mb-6">3</div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                                    Deliver with Confidence
                                </h3>
                                <p className="text-gray-600 text-center">
                                    Use or adapt the plan as needed, and download client-friendly handouts and materials.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HowItWorks;