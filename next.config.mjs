/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/polityka-prywatnosci",
        destination: "/privacy",
      },
      {
        source: "/warunki-korzystania",
        destination: "/terms",
      },
      {
        source: "/regulamin",
        destination: "/terms",
      },
    ];
  },
};

export default nextConfig;
