/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  transpilePackages: ['mapbox-gl'],
  images: {
    domains: ['api.mapbox.com'],
  },
};

export default nextConfig;
