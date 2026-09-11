import { NextResponse } from 'next/server'
import { ensureEnginePath } from '@/lib/engine/ensureEnginePath'
import {
  execute_jsc,
  execute_quickjs,
  execute_v8,
} from '@/lib/engine/engine_utils'
import { engineErrorOutput, engineOutput } from '@/lib/engine/engineOutput'
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
      .catch((e: any) => ({ code: 1, stdout: engineErrorOutput(e) }))

    const quickjsPromise = execute_quickjs(f)
      .then((r) => ({ code: r.exitCode, stdout: r.stdout }))
      .catch((e: any) => ({ code: 1, stdout: engineErrorOutput(e) }))

    // Unlike d8 and qjs, JSC splits useful output across both streams.
    const jscPromise = execute_jsc(f, flags)
      .then((r) => ({ code: r.exitCode, stdout: engineOutput(r) }))
      .catch((e: any) => ({ code: 1, stdout: engineErrorOutput(e) }))

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
