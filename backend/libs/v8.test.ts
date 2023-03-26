import { execute_v8 } from './engine_utils'
import * as path from 'path'

test('v8 output', async () => {
  let js_file = path.join(__dirname, 't1.js')
  const r = await execute_v8(js_file)
  expect(r).toBeDefined()
})
