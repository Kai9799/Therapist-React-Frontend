import { CheckCircle } from 'lucide-react';
import Footer from '../Footer';
import Navbar from '../header/navbar';
import { Link } from 'react-router-dom';

const SuccessPage = () => {
    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 text-center">
                <CheckCircle className="text-green-500 w-16 h-16 mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription Successful!</h1>
                <p className="text-gray-600 mb-6">
                    Thank you for subscribing to TheraPlan. Your access will begin immediately.
                </p>
                <Link to="/">
                    <a className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                        Go to Home
                    </a>
                </Link>
            </main>
            <Footer />
        </>
    );
};

export default SuccessPage;
