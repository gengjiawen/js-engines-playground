import { NextResponse } from 'next/server'
import { ensureEnginePath } from '@/lib/engine/ensureEnginePath'
import { execute_jsc } from '@/lib/engine/engine_utils'
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
    const r = await execute_jsc(f, flags)
    // `-d` dumps to stderr, so stdout alone leaves the diff page blank.
    return NextResponse.json({
      code: r.exitCode,
      stdout: engineOutput(r),
    })
  } catch (e: any) {
    return NextResponse.json({ code: 1, stdout: engineErrorOutput(e) })
  } finally {
    await safeUnlink(f)
  }
}
