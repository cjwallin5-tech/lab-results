import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The extraction prompt is a content file read at runtime on the live path
  // (src/lib/extract/live.ts). Trace it into the serverless bundle so it ships
  // on Vercel; without this the file is absent from the lambda and the live
  // read fails. The offline path uses static JSON imports and needs no tracing.
  outputFileTracingIncludes: {
    '/provider/**': ['./src/lib/extract/extract-prompt.md'],
  },
};

export default nextConfig;
