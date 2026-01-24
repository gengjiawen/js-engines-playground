import * as execa from 'execa'
import path from 'path'

function getEngineEnv() {
  if (!process.env.VERCEL) return process.env
  const existing = process.env.PATH ?? ''
  const jsvuBin = path.join(process.cwd(), '.jsvu', 'bin')
  if (existing.split(path.delimiter).includes(jsvuBin)) {
    return process.env
  }
  return {
    ...process.env,
    PATH: [jsvuBin, existing].join(path.delimiter),
  }
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
