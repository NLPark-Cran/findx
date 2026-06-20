import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  turbopack: {
    root: ".",
  },
  async rewrites() {
    return [
      {
        source: "/showcase",
        destination: "/showcase.html",
      },
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8006/api/:path*",
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withNextIntl(nextConfig);
