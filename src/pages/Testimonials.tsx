import React from 'react';

const Testimonials: React.FC = () => {
    return (
        <div className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="lg:text-center mb-12">
                    <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl text-center">
                        What Therapists Are Saying
                    </h2>
                    <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
                        TheraPlan is already helping therapists around the world simplify their workflow, reduce burnout, and show up more present for their clients.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Review 1 */}
                    <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
                        <div className="flex items-center mb-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <svg key={star} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            ))}
                        </div>
                        <blockquote className="mt-4">
                            <p className="text-gray-600 mb-4">
                                "TheraPlan has completely changed how I approach session prep. I used to spend my evenings and weekends planning sessions, building worksheets, and figuring out what resources to use. Now, I log in, set the focus for the session, and it's done in minutes. It's not just a time-saver—it's made me feel more confident going into each session with a clear structure. It feels like having a co-therapist in the background doing the admin work for me."
                            </p>
                            <footer className="text-sm">
                                <cite className="font-medium text-gray-900">Jessica M., LCSW</cite>
                                <p className="text-gray-500">Private Practice</p>
                            </footer>
                        </blockquote>
                    </div>

                    {/* Review 2 */}
                    <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
                        <div className="flex items-center mb-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <svg key={star} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            ))}
                        </div>
                        <blockquote className="mt-4">
                            <p className="text-gray-600 mb-4">
                                "As someone who sees 25+ clients a week, session prep was becoming overwhelming. I've tried templates and planners before, but they never quite fit my style. TheraPlan actually tailors the sessions to my modality and the client's needs, which is huge. The ability to generate handouts and exercises on the spot has saved me so much time. I now have more energy for my clients—and for myself."
                            </p>
                            <footer className="text-sm">
                                <cite className="font-medium text-gray-900">Dr. Ryan S.</cite>
                                <p className="text-gray-500">Clinical Psychologist</p>
                            </footer>
                        </blockquote>
                    </div>

                    {/* Review 3 */}
                    <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
                        <div className="flex items-center mb-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <svg key={star} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            ))}
                        </div>
                        <blockquote className="mt-4">
                            <p className="text-gray-600 mb-4">
                                "I didn't think I'd trust AI for something as personal as therapy planning—but I'm so glad I gave TheraPlan a try. It's not replacing my clinical judgment, it's enhancing it. I still review and tweak the plans, but starting from something structured has made a world of difference. It's especially useful on those days when you're drained and still want to deliver a high-quality, intentional session."
                            </p>
                            <footer className="text-sm">
                                <cite className="font-medium text-gray-900">Alex T.</cite>
                                <p className="text-gray-500">Registered Counsellor</p>
                            </footer>
                        </blockquote>
                    </div>
                </div>

                {/* Trust Boost */}
                <div className="mt-12 text-center">
                    <div className="inline-flex items-center bg-indigo-50 rounded-full px-6 py-2">
                        <div className="flex items-center mr-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <svg key={star} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            ))}
                        </div>
                        <span className="text-indigo-800 font-medium">4.9/5 from early beta users</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Testimonials;