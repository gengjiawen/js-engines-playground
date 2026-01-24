import { randomBytes } from 'crypto'
import { writeFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'

export async function writeTmpJsFile(jsCode: string) {
  const f = path.join(tmpdir(), `${randomBytes(7).toString('hex')}.js`)
  await writeFile(f, jsCode)
  return f
}

export async function safeUnlink(filePath: string) {
  try {
    await unlink(filePath)
  } catch {
    // ignore
  }
}
