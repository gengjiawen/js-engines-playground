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
