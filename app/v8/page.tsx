'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import debounce from 'lodash.debounce'
import { Editor } from '@/components/Editor'
import { getUrl } from '@/lib/getUrl'

export default function V8InspectPage() {
  const [jsCode, setJsCode] = useState(
    `function add(a, b) { \n return a + b; \n}\n`
  )
  const [flags, setFlags] = useState('--print-bytecode')
  const [compilerOut, setCompilerOut] = useState('')

  const run = useCallback((code: string, currentFlags: string) => {
    const formdata = new FormData()
    formdata.append('js_code', code)
    formdata.append('flags', currentFlags)

    fetch(getUrl('v8'), { method: 'POST', body: formdata })
      .then((response) => response.text())
      .then((result) => {
        const out = JSON.parse(result).stdout
        setCompilerOut(out)
      })
      .catch((error) => console.log('error', error))
  }, [])

  const debouncedRun = useMemo(() => debounce(run, 500), [run])

  useEffect(() => {
    run(jsCode, flags)
    return () => {
      debouncedRun.cancel()
    }
  }, [debouncedRun, flags, jsCode, run])

  return (
    <div className="flex h-screen">
      <div className="w-1/2">
        <Editor
          onChange={(value) => {
            setJsCode(value)
            debouncedRun(value, flags)
          }}
          code={jsCode}
        />
      </div>
      <div className="w-1/2">
        <label
          htmlFor="flags"
          className="block text-sm font-medium text-gray-700"
        >
          Flags
        </label>
        <div className="mt-1">
          <input
            id="flags"
            name="flags"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={flags}
            onChange={(event) => {
              const next = event.target.value
              setFlags(next)
              debouncedRun(jsCode, next)
            }}
          />
        </div>

        <Editor
          code={compilerOut}
          extra={{ readOnly: true, editable: false }}
        />
      </div>
    </div>
  )
}
