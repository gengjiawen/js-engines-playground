import { NextResponse } from 'next/server'
import { ensureEnginePath } from '@/lib/engine/ensureEnginePath'
import {
  execute_jsc,
  execute_quickjs,
  execute_v8,
} from '@/lib/engine/engine_utils'
import { safeUnlink, writeTmpJsFile } from '@/lib/engine/tmpJsFile'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  ensureEnginePath()

  const form = await request.formData()
  const js_code = String(form.get('js_code') ?? '')
  const flags = String(form.get('flags') ?? '')

  const f = await writeTmpJsFile(js_code)

  try {
    const v8Promise = execute_v8(f, flags)
      .then((r) => ({ code: r.exitCode, stdout: r.stdout }))
      .catch((e: any) => ({
        code: 1,
        stdout: e?.stderr ?? e?.toString?.() ?? String(e),
      }))

    const quickjsPromise = execute_quickjs(f)
      .then((r) => ({ code: r.exitCode, stdout: r.stdout }))
      .catch((e: any) => ({
        code: 1,
        stdout: e?.stderr ?? e?.toString?.() ?? String(e),
      }))

    const jscPromise = execute_jsc(f, flags)
      .then((r) => ({ code: r.exitCode, stdout: r.stdout }))
      .catch((e: any) => ({
        code: 1,
        stdout: e?.stderr ?? e?.toString?.() ?? String(e),
      }))

    const [v8Result, quickjsResult, jscResult] = await Promise.all([
      v8Promise,
      quickjsPromise,
      jscPromise,
    ])

    return NextResponse.json({
      v8: v8Result,
      quickjs: quickjsResult,
      jsc: jscResult,
    })
  } finally {
    await safeUnlink(f)
  }
}
