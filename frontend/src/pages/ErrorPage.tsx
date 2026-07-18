import { Link, useRouteError } from 'react-router';

interface RouteError {
  status?: number;
  statusText?: string;
  data?: string;
  message?: string;
}

export default function ErrorPage() {
  const error = useRouteError() as RouteError;
  const is404 = error?.status === 404 || !error;

  return (
    <div className="flex items-center justify-center min-h-[60vh] bg-[#f9fafb]">
      <div className="text-center max-w-md">
        {is404 ? (
          <>
            <div className="mb-4 flex justify-center">
              <svg className="w-16 h-16 text-[#9ca3af]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-[#111827] mb-2">Page not found</h1>
            <p className="text-sm text-[#6b7280] mb-6">
              {error?.data || 'The page or resource you are looking for does not exist.'}
            </p>
            <Link
              to="/bundles"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4f46e5] text-white rounded-md text-sm font-medium hover:bg-indigo-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Back to Bundles
            </Link>
          </>
        ) : (
          <>
            <div className="mb-4 flex justify-center">
              <svg className="w-16 h-16 text-[#dc2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-[#111827] mb-2">Something went wrong</h1>
            <p className="text-sm text-[#6b7280] mb-2">
              {error?.statusText || error?.message || 'An unexpected error occurred.'}
            </p>
            {error?.status && (
              <p className="text-xs text-[#9ca3af] mb-6">
                Error {error.status}
                {error.data && ` — ${error.data}`}
              </p>
            )}
            <div className="flex justify-center gap-2">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4f46e5] text-white rounded-md text-sm font-medium hover:bg-indigo-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
              <Link
                to="/bundles"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-[#374151] bg-white border border-[#e5e7eb] rounded-md text-sm font-medium hover:bg-gray-50"
              >
                Back to Bundles
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
