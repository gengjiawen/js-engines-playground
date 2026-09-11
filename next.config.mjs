import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel's adapter packages the build itself, and on Next 16.3 `standalone`
  // makes its onBuildComplete step fail on a missing next-server.js.nft.json.
  // The Dockerfile still needs standalone, so only opt out on Vercel.
  output: process.env.VERCEL ? undefined : 'standalone',
  outputFileTracingIncludes: {
    '*': ['.jsvu/**/*'],
  },
  turbopack: {
    // Avoid Turbopack walking up to a random lockfile outside this repo.
    root: __dirname,
  },
}

export default nextConfig
