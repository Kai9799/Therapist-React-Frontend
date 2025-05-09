import { Brain, Calendar, FileText, Shield, Users } from 'lucide-react';
import React from 'react';

const Features: React.FC = () => {
    return (
        <div className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="lg:text-center">
                    <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-center">
                        Everything You Need to Plan Smarter Sessions—Fast
                    </p>
                </div>

                <div className="mt-10">
                    <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-x-8 md:gap-y-10">
                        <div className="relative">
                            <dt>
                                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                                    <Brain className="h-6 w-6" />
                                </div>
                                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">One-Click Session Plans</p>
                            </dt>
                            <dd className="mt-2 ml-16 text-base text-gray-500">
                                Instantly generate structured, personalized session plans based on therapy type, client needs, and goals.
                            </dd>
                        </div>

                        <div className="relative">
                            <dt>
                                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Built-In Resource Generator</p>
                            </dt>
                            <dd className="mt-2 ml-16 text-base text-gray-500">
                                Create worksheets, handouts, exercises, and more—tailored to your session focus and ready to share.
                            </dd>
                        </div>

                        <div className="relative">
                            <dt>
                                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                                    <Calendar className="h-6 w-6" />
                                </div>
                                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Therapy-Specific Options</p>
                            </dt>
                            <dd className="mt-2 ml-16 text-base text-gray-500">
                                Supports over 20 different therapy styles so your customised plans align with your practice style.
                            </dd>
                        </div>

                        <div className="relative">
                            <dt>
                                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Client-Friendly Outputs</p>
                            </dt>
                            <dd className="mt-2 ml-16 text-base text-gray-500">
                                Easily download or copy content to share directly with clients—no extra formatting needed.
                            </dd>
                        </div>

                        <div className="relative">
                            <dt>
                                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                                    <Shield className="h-6 w-6" />
                                </div>
                                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Secure and Private</p>
                            </dt>
                            <dd className="mt-2 ml-16 text-base text-gray-500">
                                Built with ethical AI principles to keep your practice confidential and compliant.
                            </dd>
                        </div>

                        <div className="relative">
                            <dt>
                                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                                    <Users className="h-6 w-6" />
                                </div>
                                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Designed for Therapists</p>
                            </dt>
                            <dd className="mt-2 ml-16 text-base text-gray-500">
                                No fluff—just practical tools built for real-world clinical use.
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>
        </div>
    );
};

export default Features;