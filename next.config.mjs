/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly set which modules to use with Edge Runtime
  experimental: {
    serverComponentsExternalPackages: [
      'bcryptjs',
      'mongodb',
      'jsonwebtoken'
    ],
  },
  // Handle package-specific issues
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prevent specific modules from being used in Edge Runtime
      config.resolve.alias = {
        ...config.resolve.alias,
        // Avoid Edge Runtime issues with these packages
        crypto: false,
        stream: false,
        fs: false,
        os: false,
        zlib: false,
        http: false,
        https: false,
        url: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    return config;
  },
};

export default nextConfig;
