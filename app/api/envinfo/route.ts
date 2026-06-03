import { NextResponse } from 'next/server'

const envinfo = require('envinfo') as {
  run: (
    config: Record<string, unknown>,
    options?: Record<string, unknown>
  ) => Promise<string>
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type EnvinfoResponse = {
  generatedAt: string
  deploymentEnv: Record<string, string | null>
  process: {
    platform: NodeJS.Platform
    arch: string
    node: string
    versions: NodeJS.ProcessVersions
  }
  envinfo: unknown
}

let cachedReport: Promise<EnvinfoResponse> | null = null

function getSafeDeploymentEnv() {
  return {
    NODE_ENV: process.env.NODE_ENV ?? null,
    VERCEL: process.env.VERCEL ?? null,
    VERCEL_ENV: process.env.VERCEL_ENV ?? null,
    VERCEL_REGION: process.env.VERCEL_REGION ?? null,
    VERCEL_URL: process.env.VERCEL_URL ?? null,
    VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
  }
}

async function getEnvinfoReport(): Promise<EnvinfoResponse> {
  const report = await envinfo.run(
    {
      System: ['OS', 'CPU', 'Memory', 'Shell'],
      Binaries: ['Node', 'npm', 'pnpm', 'Yarn', 'bun'],
      Utilities: ['Git'],
      Languages: ['Bash'],
      npmPackages: ['next', 'react', 'react-dom', 'envinfo'],
    },
    {
      json: true,
      showNotFound: true,
    }
  )

  return {
    generatedAt: new Date().toISOString(),
    deploymentEnv: getSafeDeploymentEnv(),
    process: {
      platform: process.platform,
      arch: process.arch,
      node: process.version,
      versions: process.versions,
    },
    envinfo: JSON.parse(report),
  }
}

export async function GET() {
  cachedReport ??= getEnvinfoReport()

  try {
    const report = await cachedReport

    return NextResponse.json(report, {
      headers: {
        'Cache-Control':
          'public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=31536000, immutable',
      },
    })
  } catch (error) {
    cachedReport = null

    throw error
  }
}
