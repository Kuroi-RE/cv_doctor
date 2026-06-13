import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "pdf-parse",
    "pdfjs-dist",
    "@napi-rs/canvas",
    "openai",
    "@google/generative-ai",
  ],
  experimental: {
    workerThreads: false,
  },
};

export default nextConfig;
