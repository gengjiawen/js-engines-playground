import * as execa from 'execa'

export async function execute(
  js_file: string,
  flags: string = '--print-bytecode'
) {
  let command = `v8 ${flags} ${js_file}`
  let r = await execa.command(command, { shell: true, stdio: 'pipe' })
  return r
}
