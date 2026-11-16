/** @type {import('next').NextConfig} */
const nextConfig = {
  // Los formularios del panel envían textos largos; los archivos se suben directo a Supabase Storage.
  experimental: { serverActions: { bodySizeLimit: '5mb' } },
  eslint: { ignoreDuringBuilds: true },
  // Ejecuta `npm run typecheck` para revisar tipos; no bloqueamos la publicación por avisos de tipos.
  typescript: { ignoreBuildErrors: true },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      { source: '/admin/(.*)', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    ];
  },
};
export default nextConfig;
