import * as Koa from 'koa'
import * as Router from '@koa/router'
import * as cors from '@koa/cors'
import { koaBody } from 'koa-body'
import * as fs from 'fs/promises'
import { execute_quickjs, execute_v8 } from './engine_utils'
import * as path from 'path'

const app = new Koa()

app.use(
  koaBody({
    multipart: true,
  })
)
app.use(require('koa-compress')())
const router = new Router()

const fe = path.join(__dirname, 'dist')
const serve = require('koa-static')
app.use(serve(fe))

// in case of public download
// const mount = require('koa-mount')
// app.use(mount('/public', serve(fileDownloadLocation)))

router.post('/v8', async (ctx: Koa.Context) => {
  const { js_code, flags } = ctx.request.body
  const { temporaryFile } = await import(`tempy`)
  const f = temporaryFile({ extension: '.js' })
  await fs.writeFile(f, js_code)
  const r = await execute_v8(f, flags)
  ctx.body = {
    code: r.exitCode,
    stdout: r.stdout,
  }
})

router.post('/quickjs', async (ctx: Koa.Context) => {
  const { js_code } = ctx.request.body
  const { temporaryFile } = await import(`tempy`)
  const f = temporaryFile({ extension: '.js' })
  await fs.writeFile(f, js_code)
  const r = await execute_quickjs(f)
  ctx.body = {
    code: r.exitCode,
    stdout: r.stdout,
  }
})

app.use(cors())
app.use(router.routes()).use(router.allowedMethods())

const port = 8000
app.listen(port, () => {
  console.log(`server running http://localhost:${port}`)
})
