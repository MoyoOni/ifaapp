import React from 'react';

interface Props {
  error: Error;
}

const FallbackErrorComponent: React.FC<Props> = ({ error }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">Application Error</h3>
        <p className="mt-2 text-sm text-gray-500 break-words">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <div className="mt-6 space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Refresh Page
          </button>
          <button
            onClick={() => window.history.back()}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default FallbackErrorComponent;