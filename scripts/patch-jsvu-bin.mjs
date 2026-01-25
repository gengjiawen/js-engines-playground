import fs from 'fs'
import path from 'path'

const root = process.cwd()
const jsvuHome = path.join(root, '.jsvu')
const binDir = path.join(jsvuHome, 'bin')
const enginesDir = path.join(jsvuHome, 'engines')

function writeWrapper(name, engine, binary, extraArgs = []) {
  const target = path.join(enginesDir, engine, binary)
  if (!fs.existsSync(target)) return false

  const execArgs = extraArgs.length > 0 ? ` ${extraArgs.join(' ')}` : ''
  const script = [
    '#!/usr/bin/env bash',
    'set -euo pipefail',
    'SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"',
    'JSVU_HOME="$(cd "$SCRIPT_DIR/.." && pwd)"',
    `exec "$JSVU_HOME/engines/${engine}/${binary}"${execArgs} "$@"`,
    '',
  ].join('\n')

  fs.mkdirSync(binDir, { recursive: true })
  const outPath = path.join(binDir, name)
  try {
    const stat = fs.lstatSync(outPath)
    if (stat.isFile() || stat.isSymbolicLink()) {
      fs.unlinkSync(outPath)
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      console.warn(`Failed to clean ${outPath}:`, error)
    }
  }
  fs.writeFileSync(outPath, script, { mode: 0o755 })
  return true
}

writeWrapper('v8', 'v8', 'v8', [
  '--snapshot_blob="$JSVU_HOME/engines/v8/snapshot_blob.bin"',
])
writeWrapper('qjs', 'quickjs', 'qjs')
writeWrapper('quickjs', 'quickjs', 'qjs')
const jscBinary =
  fs.existsSync(path.join(enginesDir, 'javascriptcore', 'javascriptcore'))
    ? 'javascriptcore'
    : 'jsc'
const jscLoader = path.join(
  enginesDir,
  'javascriptcore',
  'lib',
  'ld-linux-x86-64.so.2'
)

if (fs.existsSync(path.join(enginesDir, 'javascriptcore', jscBinary))) {
  const useLoader = fs.existsSync(jscLoader)
  const execTarget = useLoader
    ? 'lib/ld-linux-x86-64.so.2'
    : jscBinary
  const execArgs = useLoader
    ? [
        `--library-path "$JSVU_HOME/engines/javascriptcore/lib"`,
        `"$JSVU_HOME/engines/javascriptcore/${jscBinary}"`,
      ]
    : []
  writeWrapper('jsc', 'javascriptcore', execTarget, execArgs)
  writeWrapper('javascriptcore', 'javascriptcore', execTarget, execArgs)
}
