/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    INVITE_COOKIE_SECRET: process.env.INVITE_COOKIE_SECRET,
  },
  async redirects() {
    return [
      {
        source: "/explore",
        destination: "/home",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tiqkyqspjnuyjkfazyzg.supabase.co',
        port: '',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
}

module.exports = nextConfig

