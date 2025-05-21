'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
      <h1 className="text-6xl font-bold text-red-600 mb-4">Error</h1>
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 text-center">
        Something went wrong!
      </h2>
      <p className="text-gray-600 text-lg mb-8 text-center max-w-md">
        We&apos;re sorry, but something unexpected happened. Please try again or return to the home page.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-700 transition-all"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
} 