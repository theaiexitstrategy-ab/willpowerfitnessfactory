/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images-api.printify.com' },
      { protocol: 'https', hostname: 'cdn.printify.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'goelev8.ai' },
      { protocol: 'https', hostname: 'www.goelev8.ai' },
    ],
  },
};
export default nextConfig;
