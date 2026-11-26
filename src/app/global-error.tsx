'use client';

/**
 * Last-resort boundary when the root layout itself fails. It renders its own document, so it
 * uses inline styles that match the design without depending on the app's stylesheets.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en-GB">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          background: '#F7F5EF',
          color: '#15173A',
          fontFamily: 'Georgia, serif',
          padding: 24,
        }}
      >
        <main style={{ maxWidth: 520, textAlign: 'center' }}>
          <h1 style={{ fontWeight: 400, fontSize: 36, margin: '0 0 12px' }}>Kickoff couldn’t load</h1>
          <p style={{ fontFamily: 'system-ui, sans-serif', color: '#6B6558', lineHeight: 1.6 }}>
            Something went wrong on our side. Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 16,
              minHeight: 44,
              padding: '0 20px',
              border: 0,
              borderRadius: 8,
              background: '#835A1E',
              color: '#FFFDF8',
              font: '500 15px system-ui, sans-serif',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
