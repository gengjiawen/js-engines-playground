import path from 'path'

let injected = false

export function ensureEnginePath() {
  if (injected) return

  const binaryFolder = path.join(process.cwd(), 'binary', process.platform)

  process.env.PATH = binaryFolder + path.delimiter + (process.env.PATH ?? '')
  injected = true
}
