import type { NextConfig } from 'next';
import { PRIVATE_ROUTE_HEADERS, securityHeaders } from './src/lib/security/headers';

const dev = process.env.NODE_ENV !== 'production';

const pdfFonts = ['./src/lib/pdf/fonts/**/*'];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // The PDF routes read the brand fonts from disk, so the files must ship with those functions.
  outputFileTracingIncludes: {
    '/api/briefs/[id]/pdf': pdfFonts,
    '/api/share/[token]/pdf': pdfFonts,
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders(dev) },
      { source: '/share/:path*', headers: PRIVATE_ROUTE_HEADERS },
      { source: '/start/:path+', headers: PRIVATE_ROUTE_HEADERS },
      { source: '/api/briefs/:path*', headers: PRIVATE_ROUTE_HEADERS },
      { source: '/api/share/:path*', headers: PRIVATE_ROUTE_HEADERS },
    ];
  },
};

export default nextConfig;
