import * as execa from 'execa'

export async function execute_v8(
  jsFile: string,
  flags: string = '--print-bytecode'
) {
  const command = `v8 ${flags} ${jsFile}`.trim()
  return await execa.command(command, { shell: true, stdio: 'pipe' })
}

export async function execute_quickjs(jsFile: string) {
  const command = `qjs ${jsFile}`.trim()
  return await execa.command(command, { shell: true, stdio: 'pipe' })
}

export async function execute_quickjs_debug(
  jsFile: string,
  flags: string = ''
) {
  const command = `qjs-debug ${flags} ${jsFile}`.trim()
  return await execa.command(command, { shell: true, stdio: 'pipe' })
}

export async function execute_jsc(jsFile: string, flags: string = '') {
  const command = `jsc ${flags} ${jsFile}`.trim()
  return await execa.command(command, { shell: true, stdio: 'pipe' })
}
