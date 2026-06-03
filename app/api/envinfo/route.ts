import { NextResponse } from 'next/server'

const envinfo = require('envinfo') as {
  run: (
    config: Record<string, unknown>,
    options?: Record<string, unknown>
  ) => Promise<string>
  helpers: {
    getGLibcInfo: () => Promise<[string, string?, string?]>
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type EnvinfoResponse = {
  generatedAt: string
  deploymentEnv: Record<string, string | null>
  envinfo: unknown
}

type EnvinfoReport = {
  System?: Record<string, unknown>
  [key: string]: unknown
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
  const [report, glibcInfo] = await Promise.all([
    envinfo.run(
      {
        System: ['OS', 'CPU', 'Memory', 'Shell'],
        Binaries: ['Node', 'npm', 'pnpm', 'Yarn', 'bun'],
        Utilities: ['Git'],
        Languages: ['Bash'],
      },
      {
        json: true,
        showNotFound: false,
      }
    ),
    envinfo.helpers.getGLibcInfo().catch(() => null),
  ])

  const parsedReport = JSON.parse(report) as EnvinfoReport

  if (glibcInfo?.[1]) {
    parsedReport.System = {
      ...parsedReport.System,
      [glibcInfo[0]]: glibcInfo[2]
        ? {
            version: glibcInfo[1],
            path: glibcInfo[2],
          }
        : glibcInfo[1],
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    deploymentEnv: getSafeDeploymentEnv(),
    envinfo: parsedReport,
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
