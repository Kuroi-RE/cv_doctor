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
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
