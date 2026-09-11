import * as execa from 'execa'
import fs from 'fs'
import os from 'os'
import path from 'path'

let cachedEnv: NodeJS.ProcessEnv | null = null

function getEngineEnv() {
  if (cachedEnv) return cachedEnv
  const existing = process.env.PATH ?? ''
  const parts = existing.split(path.delimiter)
  const candidates = [
    process.env.JSVU_BIN_DIR,
    path.join(process.cwd(), '.jsvu', 'bin'),
    path.join(os.homedir(), '.jsvu', 'bin'),
  ].filter((candidate): candidate is string => Boolean(candidate))

  const toPrepend = candidates.filter(
    (candidate) => fs.existsSync(candidate) && !parts.includes(candidate)
  )

  cachedEnv =
    toPrepend.length === 0
      ? process.env
      : {
          ...process.env,
          PATH: [...toPrepend, existing].join(path.delimiter),
        }
  return cachedEnv
}

export async function execute_v8(
  jsFile: string,
  flags: string = '--print-bytecode'
) {
  const command = `v8 ${flags} ${jsFile}`.trim()
  return await execa.command(command, {
    shell: true,
    stdio: 'pipe',
    env: getEngineEnv(),
  })
}

export async function execute_quickjs(jsFile: string) {
  const command = `qjs ${jsFile}`.trim()
  return await execa.command(command, {
    shell: true,
    stdio: 'pipe',
    env: getEngineEnv(),
  })
}

export async function execute_quickjs_debug(
  jsFile: string,
  flags: string = ''
) {
  const command = `qjs-debug ${flags} ${jsFile}`.trim()
  return await execa.command(command, {
    shell: true,
    stdio: 'pipe',
    env: getEngineEnv(),
  })
}

// JavaScriptCore's shell has no `console` — only `print` and `printErr` — so a
// snippet as ordinary as `console.log('hi')` dies with "undefined is not an
// object" before printing anything. d8 and qjs stringify console.log arguments
// exactly the way print does (`[object Object]`, comma-joined arrays), so
// aliasing the two makes all three engines agree byte for byte.
//
// It goes in via `-e` rather than a prelude file so the user's script stays the
// only source file and line numbers in stack traces still point at their code.
const JSC_CONSOLE_SHIM =
  'globalThis.console||(globalThis.console={log:print,info:print,debug:print,trace:print,warn:printErr,error:printErr});'

export async function execute_jsc(jsFile: string, flags: string = '') {
  const command = ['jsc', flags, '-e', `'${JSC_CONSOLE_SHIM}'`, jsFile]
    .filter(Boolean)
    .join(' ')
  return await execa.command(command, {
    shell: true,
    stdio: 'pipe',
    env: getEngineEnv(),
  })
}
