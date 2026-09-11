## the `jsc` shell has no `console`

JavaScriptCore's command-line shell exposes `print` and `printErr`, not
`console`. `console.log('hi')` therefore throws before printing anything:

```
$ jsc -e "console.log('hi')"
Exception: TypeError: undefined is not an object (evaluating 'console.log')
```

`execute_jsc` works around it by passing a one-line shim via `-e` ahead of the
user's script. `-e` is used rather than a prelude file so the script stays the
only source file and line numbers in stack traces keep pointing at the user's
code.

The aliasing is exact, not an approximation: d8 and qjs stringify
`console.log` arguments the same way `print` does, so `console.log({a: 1})`
prints `[object Object]` in all three engines.

## which stream each engine dumps to

The API routes report a single `stdout` field, so this matters:

| engine    | dump flag          | program output | dump   |
| --------- | ------------------ | -------------- | ------ |
| d8        | `--print-bytecode` | stdout         | stdout |
| qjs-debug | `-D1`              | stdout         | stdout |
| jsc       | `-d`               | stdout         | stderr |

JSC is the odd one out twice over: `-d` goes to **stderr**, and an uncaught
exception goes to **stdout** while leaving stderr empty. A route that reports
only `e.stderr` on failure therefore reports an empty string. `engineOutput`
and `engineErrorOutput` in `lib/engine/engineOutput.ts` join both streams.

Note that `jsc -d` leads with a few thousand lines of JIT thunk disassembly
before it reaches the bytecode — that is JSC's own output, not something the
app adds.
