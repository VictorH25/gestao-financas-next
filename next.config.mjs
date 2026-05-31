/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['192.168.56.1', 'localhost'],
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ]
  },
}

export default nextConfig;
