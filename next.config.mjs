import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingIncludes: {
    '*': ['.jsvu/**/*'],
  },
  turbopack: {
    // Avoid Turbopack walking up to a random lockfile outside this repo.
    root: __dirname,
  },
}

export default nextConfig
