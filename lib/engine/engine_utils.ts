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

export async function execute_jsc(jsFile: string, flags: string = '') {
  const command = `jsc ${flags} ${jsFile}`.trim()
  return await execa.command(command, {
    shell: true,
    stdio: 'pipe',
    env: getEngineEnv(),
  })
}
