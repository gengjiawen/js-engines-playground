import { execute } from './v8'
import * as path from 'path'

test('v8 output', async () => {
  let js_file = path.join(__dirname, 't1.js')
  const r = await execute(js_file)
  expect(r).toBeDefined()
})
