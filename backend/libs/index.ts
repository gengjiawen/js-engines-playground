import * as Koa from 'koa'
import * as Router from '@koa/router'
import * as cors from '@koa/cors'
import { koaBody } from 'koa-body'
import * as fs from 'fs/promises'
import * as os from 'os'
import {
  execute_quickjs,
  execute_v8,
  execute_jsc,
  execute_quickjs_debug,
} from './engine_utils'
import * as path from 'path'

const binaryFolder = path.join(__dirname, '..', 'binary', process.platform)
console.log('Injecting binary folder path:', binaryFolder)
process.env.PATH = binaryFolder + path.delimiter + process.env.PATH

const app = new Koa()

app.use(
  koaBody({
    multipart: true,
  })
)
app.use(require('koa-compress')())
const root_router = new Router()

const fe = path.join(__dirname, 'dist')
const serve = require('koa-static')
app.use(serve(fe))

root_router.get(/.*/, async (ctx) => {
  ctx.type = 'html'
  ctx.body = require('fs').createReadStream(path.join(fe, 'index.html'))
})

// in case of public download
// const mount = require('koa-mount')
// app.use(mount('/public', serve(fileDownloadLocation)))

async function getTmpJsFile() {
  const cryptoRandomString = await import(`crypto-random-string`)
  const f = path.join(
    os.tmpdir(),
    await cryptoRandomString.cryptoRandomStringAsync({ length: 7 })
  )
  return f
}

const api_router = new Router()
api_router.post('/v8', async (ctx: Koa.Context) => {
  const { js_code, flags } = ctx.request.body
  const f = await getTmpJsFile()
  await fs.writeFile(f, js_code)
  try {
    const r = await execute_v8(f, flags)
    ctx.body = {
      code: r.exitCode,
      stdout: r.stdout,
    }
  } catch (e: any) {
    console.log('v8', e)
    ctx.body = {
      code: 1,
      stdout: e?.stderr + e?.stdout ?? e.toString(),
    }
  }
})

api_router.post('/quickjs', async (ctx: Koa.Context) => {
  const { js_code } = ctx.request.body
  const f = await getTmpJsFile()
  await fs.writeFile(f, js_code)
  try {
    const r = await execute_quickjs(f)
    ctx.body = {
      code: r.exitCode,
      stdout: r.stdout,
    }
  } catch (e: any) {
    ctx.body = {
      code: 1,
      stdout: e?.stderr ?? e.toString(),
    }
  }
})

api_router.post('/qjs-debug', async (ctx: Koa.Context) => {
  const { js_code, flags } = ctx.request.body
  const f = await getTmpJsFile()
  await fs.writeFile(f, js_code)
  try {
    const r = await execute_quickjs_debug(f, flags)
    ctx.body = {
      code: r.exitCode,
      stdout: r.stdout,
    }
  } catch (e: any) {
    ctx.body = {
      code: 1,
      stdout: e?.stderr ?? e.toString(),
    }
  }
})

api_router.post('/jsc', async (ctx: Koa.Context) => {
  const { js_code, flags } = ctx.request.body
  const f = await getTmpJsFile()
  await fs.writeFile(f, js_code)
  try {
    const r = await execute_jsc(f, flags)
    ctx.body = {
      code: r.exitCode,
      stdout: r.stdout,
    }
  } catch (e: any) {
    ctx.body = {
      code: 1,
      stdout: e?.stderr ?? e.toString(),
    }
  }
})

api_router.post('/multi', async (ctx: Koa.Context) => {
  const { js_code, flags } = ctx.request.body
  const f = await getTmpJsFile()
  await fs.writeFile(f, js_code)

  // Execute each engine and handle errors individually
  const v8Promise = execute_v8(f, flags)
    .then((r) => ({ code: r.exitCode, stdout: r.stdout }))
    .catch((e) => ({ code: 1, stdout: e?.stderr ?? e.toString() }))

  const quickjsPromise = execute_quickjs(f)
    .then((r) => ({ code: r.exitCode, stdout: r.stdout }))
    .catch((e) => ({ code: 1, stdout: e?.stderr ?? e.toString() }))

  const jscPromise = execute_jsc(f)
    .then((r) => ({ code: r.exitCode, stdout: r.stdout }))
    .catch((e) => ({ code: 1, stdout: e?.stderr ?? e.toString() }))

  const [v8Result, quickjsResult, jscResult] = await Promise.all([
    v8Promise,
    quickjsPromise,
    jscPromise,
  ])

  ctx.body = {
    v8: v8Result,
    quickjs: quickjsResult,
    jsc: jscResult,
  }
})

root_router.use('/api', api_router.routes())

app.use(cors())
app.use(root_router.routes()).use(root_router.allowedMethods())

const port = 8000
app.listen(port, () => {
  console.log(`server running http://localhost:${port}`)
})
