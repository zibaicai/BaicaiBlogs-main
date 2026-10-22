import type { NextConfig } from "next";

// 浏览器固定走同源 /api（nginx 或下面的 rewrite 转发到后端）；
// 服务端页面用 API_INTERNAL 直连内网，避免多一次公网回环。
const internal = (process.env.API_INTERNAL || "http://127.0.0.1:8080").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  images: { unoptimized: true },
  reactStrictMode: true,
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${internal}/api/:path*` }];
  },
};

export default nextConfig;
