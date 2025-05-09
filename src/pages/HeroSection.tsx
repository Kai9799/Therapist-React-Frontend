import React from 'react';
import { SignUpButton } from '@clerk/clerk-react';

const HeroSection: React.FC = () => {
    return (
        <div className="relative overflow-hidden bg-white">
            <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-indigo-50 to-white"></div>
            <div className="max-w-7xl mx-auto relative">
                <div className="relative z-10 pb-8 bg-transparent sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
                    <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                        <div className="text-center lg:text-left">
                            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                                <span className="block">One-Click Session</span>
                                <span className="block text-indigo-600">Planning for Therapists</span>
                            </h1>
                            <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl md:mt-5 md:text-xl mx-auto lg:mx-0">
                                TheraPlan generates personalized session plans and resources in seconds—so you can spend more time with clients and less time on admin.
                            </p>
                            <div className="mt-5 sm:mt-8 flex justify-center lg:justify-start">
                                <div>
                                    <SignUpButton mode="modal">
                                        <button
                                            className="inline-flex items-center space-x-2 px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10 shadow-lg hover:shadow-xl transition-all duration-200"
                                        >
                                            <span>Get Started Free</span>
                                            <span className="text-xs opacity-75">No credit card required</span>
                                        </button>
                                    </SignUpButton>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
            <div className="absolute inset-y-0 right-0 W-1/2 hidden md:block bg-[url('https://images.unsplash.com/photo-1573497620053-ea5300f94f21?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80')] bg-cover bg-center opacity-80"></div>
        </div>
    );
};

export default HeroSection;