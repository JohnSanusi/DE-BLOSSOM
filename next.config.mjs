/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@kano-cooperative/finance-core'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
