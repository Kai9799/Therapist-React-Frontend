import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { SignOutButton, useAuth, useUser } from '@clerk/clerk-react';
import { useUserStore } from '../../stores/useUserStore';

const Navbar: React.FC = () => {
    const { user: zustandUser, clearUser } = useUserStore();
    const { isSignedIn, isLoaded: authLoaded } = useAuth();
    const { user: clerkUser, isLoaded: userLoaded } = useUser();

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    const toggleDropdown = useCallback(() => {
        setDropdownOpen((prev) => !prev);
    }, []);

    useEffect(() => {
        if (authLoaded && userLoaded && clerkUser && !zustandUser) {
            const token = '';
            useUserStore.getState().setUser({
                id: clerkUser.id,
                firstName: clerkUser.firstName || '',
                lastName: clerkUser.lastName || '',
                email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
                username: clerkUser.username || '',
                clerkId: clerkUser.id,
                supabaseToken: token,
            });
        }
    }, [authLoaded, userLoaded, clerkUser, zustandUser]);

    useEffect(() => {
        if (authLoaded && !isSignedIn) {
            clearUser();
        }
    }, [authLoaded, isSignedIn, clearUser]);

    const isUserAuthenticated = authLoaded && userLoaded && isSignedIn && zustandUser;

    return (
        <nav className="bg-white border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Brain className="h-8 w-8 text-indigo-600" />
                        <Link to="/" className="ml-2 text-xl font-bold text-gray-900">
                            TheraPlan
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        {isUserAuthenticated ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={toggleDropdown}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                    Hello, {zustandUser.firstName || zustandUser.lastName || 'User'}
                                    <svg
                                        className="ml-2 h-5 w-5 text-gray-500"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {dropdownOpen && (
                                    <div className="absolute right-0 w-48 mt-2 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                                        <div className="py-1">
                                            <Link
                                                to="/app"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-600 hover:text-white"
                                            >
                                                Dashboard
                                            </Link>
                                            <SignOutButton signOutCallback={clearUser}>
                                                <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-600 hover:text-white">
                                                    Sign Out
                                                </button>
                                            </SignOutButton>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/signup"
                                    className="inline-flex items-center px-4 py-2 border border-indigo-600 text-sm font-medium rounded-lg text-indigo-600 hover:bg-indigo-50"
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
