/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images-api.printify.com' },
      { protocol: 'https', hostname: 'cdn.printify.com' },
      { protocol: 'https', hostname: 'www.willpowerfitnessfactory.com' },
      { protocol: 'https', hostname: 'willpowerfitnessfactory.com' },
    ],
  },
};

export default nextConfig;
