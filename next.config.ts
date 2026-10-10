import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The inbox was renamed from Messages to Customer Queries; keep old bookmarks and emailed links working.
  async redirects() {
    return [
      { source: "/admin/messages", destination: "/admin/queries", permanent: true },
    ];
  },
};

export default nextConfig;
