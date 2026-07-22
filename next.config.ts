import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The extraction and drafting prompts are content files read at runtime on the
  // live paths (src/lib/extract/live.ts, src/lib/draft/live.ts). Trace them into
  // the serverless bundle so they ship on Vercel; without this the file is absent
  // from the lambda and the live read fails. The offline paths use static imports
  // and need no tracing.
  outputFileTracingIncludes: {
    '/provider/**': ['./src/lib/extract/extract-prompt.md', './src/lib/draft/prompt.md'],
  },
};

export default nextConfig;
