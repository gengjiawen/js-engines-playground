import * as execa from 'execa'

export async function execute_v8(
  js_file: string,
  flags: string = '--print-bytecode'
) {
  let command = `v8 ${flags} ${js_file}`
  let r = await execa.command(command, { shell: true, stdio: 'pipe' })
  return r
}

export async function execute_quickjs(js_file: string) {
  let command = `qjs ${js_file}`
  let r = await execa.command(command, { shell: true, stdio: 'pipe' })
  return r
}

export async function execute_quickjs_debug(
  js_file: string,
  flags: string = ''
) {
  let command = `qjs-debug ${flags} ${js_file}`
  console.log(command)
  let r = await execa.command(command, { shell: true, stdio: 'pipe' })
  return r
}

export async function execute_jsc(js_file: string, flags: string = '') {
  let command = `jsc ${flags} ${js_file}`
  let r = await execa.command(command, { shell: true, stdio: 'pipe' })
  return r
}
