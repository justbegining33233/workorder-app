"use client";

import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f9fafb',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: '1rem',
        }}>
          <div style={{ maxWidth: '32rem', width: '100%', textAlign: 'center' }}>
            <div style={{
              width: '5rem', height: '5rem', borderRadius: '50%',
              background: '#fee2e2', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 1.5rem',
              fontSize: '2rem',
            }}>
              &#9888;
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#6b7280', marginBottom: '2rem', lineHeight: 1.6 }}>
              An unexpected error occurred. This has been logged and we&apos;ll look into it.
              You can try again or go back to the home page.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={reset}
                style={{
                  padding: '0.75rem 1.5rem', background: '#f97316', color: 'white',
                  border: 'none', borderRadius: '0.75rem', fontWeight: 600,
                  cursor: 'pointer', fontSize: '0.875rem',
                }}
              >
                Try Again
              </button>
              <Link
                href="/"
                style={{
                  padding: '0.75rem 1.5rem', background: 'white', color: '#374151',
                  border: '1px solid #d1d5db', borderRadius: '0.75rem', fontWeight: 600,
                  textDecoration: 'none', fontSize: '0.875rem',
                }}
              >
                Go Home
              </Link>
            </div>
            {error.digest && (
              <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
