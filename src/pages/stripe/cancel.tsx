import { XCircle } from 'lucide-react';
import Footer from '../Footer';
import Navbar from '../header/navbar';
import { Link } from 'react-router-dom';

const CancelPage = () => {
    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 text-center">
                <XCircle className="text-red-500 w-16 h-16 mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout Canceled</h1>
                <p className="text-gray-600 mb-6">
                    Your subscription process was canceled. You can restart it anytime.
                </p>
                <Link to="/">
                    <a className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                        View Plans Again
                    </a>
                </Link>
                <p className="mt-4 text-sm text-gray-500">
                    Need help? <Link to="/"><a className="text-indigo-600 hover:underline">Contact support</a></Link>
                </p>
            </main>
            <Footer />
        </>
    );
};

export default CancelPage;
