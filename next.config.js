/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  async rewrites() {
    const configured = process.env.API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4000');
    if (!configured) {
      throw new Error('API_URL is required for production builds');
    }
    const backend = new URL(configured);
    if (!['http:', 'https:'].includes(backend.protocol) || backend.origin !== configured.replace(/\/$/, '')) {
      throw new Error('API_URL must be a valid backend origin without a path');
    }
    return [
      {
        source: '/api/:path*',
        destination: `${backend.origin}/:path*`,
      },
    ];
  },
  async headers() {
    const headers = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ];
    if (process.env.NODE_ENV === 'production') {
      headers.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains',
      });
    }
    return [{ source: '/(.*)', headers }];
  },
};

module.exports = nextConfig;
