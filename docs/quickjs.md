## rebuilding qjs-debug

`binary/linux/qjs-debug` is a custom quickjs-ng build — upstream's release
binaries are compiled with `NDEBUG`, which strips the `-D` bytecode dumps the
`/quickjs` and `/diff` pages rely on.

It must be **statically linked**. Vercel's Node runtime is Amazon Linux 2023
(glibc 2.34), so a binary built against a newer glibc dies at startup with
`version 'GLIBC_2.35' not found`.

```sh
docker run --name qjsbuild alpine:3.21 sh -c '
  apk add --no-cache build-base cmake ninja git
  git clone --depth 1 --branch v0.16.2 https://github.com/quickjs-ng/quickjs.git /src
  cd /src
  cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=Release \
    -DQJS_BUILD_CLI_STATIC=ON -DCMAKE_C_FLAGS="-DENABLE_DUMPS"
  cmake --build build --target qjs
'
docker cp qjsbuild:/src/build/qjs binary/linux/qjs-debug
docker rm qjsbuild
```

`ldd binary/linux/qjs-debug` should report `not a dynamic executable`.

## get function name

````c
In QuickJS, you can get the function name from a `JSValue` that represents a JavaScript function by using the `JS_GetPropertyStr` function to get its "name" property. Here is a simple example:

```c
#include "quickjs.h"

void get_function_name(JSContext *ctx, JSValueConst func) {
    JSValue name_val;

    // Get the "name" property of the function.
    name_val = JS_GetPropertyStr(ctx, func, "name");

    // Check if the "name" property is a string.
    if (JS_IsString(name_val)) {
        const char *name;

        // Convert the JSValue to a C string.
        name = JS_ToCString(ctx, name_val);

        if (name != NULL) {
            printf("Function name: %s\n", name);

            // Don't forget to free the C string after use.
            JS_FreeCString(ctx, name);
        }
    }

    // Don't forget to free the JSValue after use.
    JS_FreeValue(ctx, name_val);
}
````

In this example, `ctx` is a `JSContext *` that represents the current QuickJS context, and `func` is a `JSValueConst` that represents the JavaScript function.

Please note that this will only work if the function has a name. Anonymous functions (like `function() {}`) do not have a name, and in such cases, the "name" property will be an empty string.

Also, note that `JS_GetPropertyStr`, `JS_ToCString`, and `JS_FreeCString` may fail due to out-of-memory errors, in which case they return `NULL`. In a real program, you should check for these errors and handle them appropriately.

```

```
