'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import debounce from 'lodash.debounce'
import { Editor } from '@/components/Editor'
import { ExecuteBox } from '@/components/ExecuteBox'
import { getUrl } from '@/lib/getUrl'

export default function ExecuteEnginePage() {
  const [jsCode, setJsCode] = useState(`print('hi')`)
  const [v8Output, setV8Output] = useState('')
  const [quickjsOutput, setQuickjsOutput] = useState('')
  const [jscOutput, setJscOutput] = useState('')

  const run = useCallback(
    (code: string) => {
      if (code.trim() === '') {
        setV8Output('')
        setQuickjsOutput('')
        setJscOutput('')
        return
      }

      const formdata = new FormData()
      formdata.append('js_code', code)
      formdata.append('flags', '')

      fetch(getUrl('multi'), { method: 'POST', body: formdata })
        .then((r) => r.json())
        .then((result) => {
          setV8Output(result?.v8?.stdout ?? '')
          setQuickjsOutput(result?.quickjs?.stdout ?? '')
          setJscOutput(result?.jsc?.stdout ?? '')
        })
        .catch((error) => {
          console.log('error', error)
        })
    },
    [setJscOutput, setQuickjsOutput, setV8Output]
  )

  const debouncedRun = useMemo(() => debounce(run, 500), [run])

  useEffect(() => {
    run(jsCode)
    return () => {
      debouncedRun.cancel()
    }
  }, [debouncedRun, jsCode, run])

  return (
    <div className="flex h-screen">
      <div className="w-1/2">
        <Editor
          code={jsCode}
          onChange={(value) => {
            setJsCode(value)
            debouncedRun(value)
          }}
        />
      </div>
      <div className="w-1/2">
        <ExecuteBox
          title="V8 result"
          content={v8Output}
        />
        <div className="border-b-2 border-gray-300 my-4"></div>
        <ExecuteBox
          title="Quickjs result"
          content={quickjsOutput}
        />
        <div className="border-b-2 border-gray-300 my-4"></div>
        <ExecuteBox
          title="JavaScriptCore (JSC) result"
          content={jscOutput}
        />
      </div>
    </div>
  )
}
