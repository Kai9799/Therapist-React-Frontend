import React from 'react';
import { SignInButton } from '@clerk/clerk-react';
import { CheckCircle } from 'lucide-react';

const TimeSavingSection: React.FC = () => {
    return (
        <div className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="lg:text-center mb-12">
                    <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl text-center">
                        How Much Time Can You Actually Save?
                    </h2>
                    <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
                        TheraPlan doesn't just help—it gives you real hours back every single week. Here's how it adds up for the average therapist:
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Before TheraPlan */}
                    <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <span className="text-red-500 mr-2">⏰</span>
                            Before TheraPlan
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-red-100 text-red-500">
                                    <span className="text-sm">•</span>
                                </div>
                                <p className="ml-3 text-gray-600">10–20 minutes spent planning each session</p>
                            </div>
                            <div className="flex items-start">
                                <div className="flex-shrink-0 h-6 w-6 asdasd flex items-center justify-center rounded-full bg-red-100 text-red-500">
                                    <span className="text-sm">•</span>
                                </div>
                                <p className="ml-3 text-gray-600">10–20 minutes searching for resources or worksheets</p>
                            </div>
                            <div className="flex items-start">
                                <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-red-100 text-red-500">
                                    <span className="text-sm">•</span>
                                </div>
                                <p className="ml-3 text-gray-600">10–20 minutes writing client handouts or exercises</p>
                            </div>
                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <div className="flex items-center text-red-600 font-medium">
                                    <span className="text-lg mr-2">❌</span>
                                    Up to 60 minutes spent per client before the session even begins
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* After TheraPlan */}
                    <div className="bg-white rounded-lg shadow-sm p-8 border border-green-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <span className="text-green-500 mr-2">✨</span>
                            After TheraPlan
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-green-100 text-green-500">
                                    <span className="text-sm">•</span>
                                </div>
                                <p className="ml-3 text-gray-600">Plan generated in under 30 seconds </p>
                            </div>
                            <div className="flex items-start">
                                <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-green-100 text-green-500">
                                    <span className="text-sm">•</span>
                                </div>
                                <p className="ml-3 text-gray-600">Resources created instantly based on your session goals</p>
                            </div>
                            <div className="flex items-start">
                                <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full Bg-green-100 text-green-500">
                                    <span className="text-sm">•</span>
                                </div>
                                <p className="ml-3 text-gray-600">Client materials ready to share—no formatting needed</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Real Impact */}
                <div className="mt-12 bg-white rounded-lg shadow-sm p-8 border border-indigo-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                        <span className="text-indigo-500 mr-2"></span>
                        Real Impact
                    </h3>
                    <p className="text-lg text-gray-700 mb-8">
                        If you're seeing 4 to 6 clients a day, you're saving 2–3 hours every week—that's over an entire workday every month just from smarter prep.
                    </p>
                    <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 flex items-center mb-4">
                            <span className="text-indigo-500 mr-2"></span>
                            Use that time to:
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center bg-indigo-50 rounded-lg p-4">
                                <CheckCircle className="h-5 w-5 text-indigo-500 mr-2" />
                                <span className="text-gray-700">Take on more clients</span>
                            </div>
                            <div className="flex items-center bg-indigo-50 rounded-lg p-4">
                                <CheckCircle className="h-5 w-5 text-indigo-500 mr-2" />
                                <span className="text-gray-700">Rest and recharge</span>
                            </div>
                            <div className="flex items-center bg-indigo-50 rounded-lg p-4">
                                <CheckCircle className="h-5 w-5 text-indigo-500 mr-2" />
                                <span className="text-gray-700">Focus on clinical work</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-12 text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Ready to reclaim your time?</h3>
                    <SignInButton mode="modal">
                        <button className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10">
                            Start Planning Free
                        </button>
                    </SignInButton>
                </div>
            </div>
        </div>
    );
};

export default TimeSavingSection;