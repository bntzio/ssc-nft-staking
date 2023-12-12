/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'shdw-drive.genesysgo.net',
        port: '',
        pathname: '/**/*.png',
      },
    ],
  },
}

module.exports = nextConfig
