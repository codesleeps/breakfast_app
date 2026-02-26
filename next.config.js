const isDev = process.env.NODE_ENV === "development";

/** @type {import("next").NextConfig} */
const config = {
  images: {
    domains: ["vybe.build", "i.ibb.co", "cdn.brandfetch.io", "images.unsplash.com"],
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  devIndicators: false,
  ...(isDev && {
    experimental: {
      swcPlugins: [["@vybe-adk/swc-dom-source", { attr: "data-source", exclude: ["components/ui"] }]],
    },
  }),
  webpack: (webpackConfig, { dev }) => {
    if (!dev) {
      webpackConfig.cache = Object.freeze({
        type: "filesystem",
        maxMemoryGenerations: 1,
        maxAge: 1000 * 60 * 60 * 24, // one day
      });
    }
    return webpackConfig;
  },
  // Security headers for production
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://images.unsplash.com https://vybe.build https://i.ibb.co https://cdn.brandfetch.io; font-src 'self'; connect-src 'self' https://*.neon.tech; frame-ancestors 'none';",
          },
        ],
      },
    ];
  },
};

export default config;
