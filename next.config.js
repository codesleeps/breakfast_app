const isDev = process.env.NODE_ENV === "development";

/** @type {import("next").NextConfig} */
const config = {
  images: {
    domains: ["vybe.build", "i.ibb.co", "cdn.brandfetch.io"],
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
};

export default config;
