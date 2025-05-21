import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center">
      <h1 className="text-6xl font-bold text-indigo-600 mb-4">404</h1>
      <h2 className="text-3xl font-semibold mb-6 text-gray-800">Page Not Found</h2>
      <p className="text-gray-600 text-lg mb-8">The page you are looking for doesn&apos;t exist or has been moved.</p>
      <Link
        href="/"
        className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all"
      >
        Back to Home
      </Link>
    </div>
  );
} 