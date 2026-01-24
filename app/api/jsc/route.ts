import { NextResponse } from 'next/server'
import { ensureEnginePath } from '@/lib/engine/ensureEnginePath'
import { execute_jsc } from '@/lib/engine/engine_utils'
import { safeUnlink, writeTmpJsFile } from '@/lib/engine/tmpJsFile'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  ensureEnginePath()

  const form = await request.formData()
  const js_code = String(form.get('js_code') ?? '')
  const flags = String(form.get('flags') ?? '')

  const f = await writeTmpJsFile(js_code)
  try {
    const r = await execute_jsc(f, flags)
    return NextResponse.json({
      code: r.exitCode,
      stdout: r.stdout,
    })
  } catch (e: any) {
    const out = e?.stderr ?? e?.toString?.() ?? String(e)
    return NextResponse.json({ code: 1, stdout: out })
  } finally {
    await safeUnlink(f)
  }
}
