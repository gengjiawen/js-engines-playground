import * as Koa from 'koa'
import * as Router from '@koa/router'
import * as cors from '@koa/cors'
import * as bodyParser from 'koa-body'
import * as fs from "fs/promises";
import { execute } from "./v8";

const app = new Koa()

app.use(bodyParser({
    multipart: true,
}))
app.use(require('koa-compress')())
const router = new Router()

router.get('/', async (ctx: Koa.Context) => {
    ctx.body = 'Hello world'
})

router.post('/v8', async (ctx: Koa.Context) => {
    const { js_code, flags } = ctx.request.body
    const { temporaryFile } = await import(`tempy`)
    const f = temporaryFile({ extension: '.js' })
    await fs.writeFile(f, js_code)
    const r = await execute(f, flags)
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
