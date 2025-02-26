import React, { useEffect, useMemo, useState } from 'react'
import debounce from 'lodash.debounce'
import { DiffEditor } from '@monaco-editor/react'
import { getUrl } from '../utils/url_utils'
import { Editor } from '../Editor'

export function DiffEnginePage() {
  const [jsCode, setJsCode] = useState(
    `// Enter your JavaScript code here\nconsole.log('Hello, world!');\n`
  )
  const [v8Output, setV8Output] = useState('')
  const [quickjsOutput, setQuickjsOutput] = useState('')
  const [v8Flags, setV8Flags] = useState('--print-bytecode')
  const [quickjsFlags, setQuickjsFlags] = useState('-D1')
  const [language, setLanguage] = useState('javascript')
  const [sideBySide, setSideBySide] = useState(true)

  const toggleViewMode = () => {
    setSideBySide(!sideBySide)
  }

  const handleJsCodeChange = (value: string) => {
    setJsCode(value)
    debouncedExecuteCode()
  }

  const handleV8FlagsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setV8Flags(event.target.value)
    debouncedExecuteCode()
  }

  const handleQuickjsFlagsChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setQuickjsFlags(event.target.value)
    debouncedExecuteCode()
  }

  const executeCode = () => {
    if (jsCode.trim() === '') {
      setV8Output('')
      setQuickjsOutput('')
      return
    }

    console.log(`Executing code: ${jsCode}`)

    // Execute V8
    let v8Formdata = new FormData()
    v8Formdata.append('js_code', jsCode)
    v8Formdata.append('flags', v8Flags)

    let v8RequestOptions = {
      method: 'POST',
      body: v8Formdata,
    }

    let v8Url = getUrl('v8')
    fetch(v8Url, v8RequestOptions)
      .then((response) => response.text())
      .then((result) => {
        let out = JSON.parse(result).stdout
        setV8Output(out)
      })
      .catch((error) => console.log('error', error))

    // Execute QuickJS
    let qjsFormdata = new FormData()
    qjsFormdata.append('js_code', jsCode)
    qjsFormdata.append('flags', quickjsFlags)

    let qjsRequestOptions = {
      method: 'POST',
      body: qjsFormdata,
    }

    let qjsUrl = getUrl('qjs-debug')
    fetch(qjsUrl, qjsRequestOptions)
      .then((response) => response.text())
      .then((result) => {
        let out = JSON.parse(result).stdout
        setQuickjsOutput(out)
      })
      .catch((error) => console.log('error', error))
  }

  const debouncedExecuteCode = useMemo(
    () => debounce(executeCode, 500),
    [jsCode, v8Flags, quickjsFlags]
  )

  useEffect(() => {
    executeCode()
  }, [])

  return (
    <div className="flex flex-col h-screen">
      {/* JavaScript Input Section */}
      <div className="p-2 bg-white">
        <h1 className="text-lg font-medium text-gray-700">JavaScript Input</h1>
      </div>
      <div>
        <Editor
          code={jsCode}
          onChange={handleJsCodeChange}
        />
      </div>

      {/* Flags Section */}
      <div className="flex p-2 bg-white">
        <div className="w-1/2 pr-2">
          <label
            htmlFor="v8-flags"
            className="block text-sm font-medium text-gray-700"
          >
            V8 Flags
          </label>
          <div className="mt-1">
            <input
              id="v8-flags"
              name="v8-flags"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={v8Flags}
              onChange={handleV8FlagsChange}
            />
          </div>
        </div>
        <div className="w-1/2 pl-2">
          <label
            htmlFor="quickjs-flags"
            className="block text-sm font-medium text-gray-700"
          >
            QuickJS Flags
          </label>
          <div className="mt-1">
            <input
              id="quickjs-flags"
              name="quickjs-flags"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={quickjsFlags}
              onChange={handleQuickjsFlagsChange}
            />
          </div>
        </div>
      </div>

      {/* Diff Editor Section */}
      <div className="p-2 bg-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-medium text-gray-700">
              Engine Diff Editor
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 mr-2">
                View Mode:
              </span>
              <button
                type="button"
                onClick={toggleViewMode}
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  sideBySide
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Side by Side
              </button>
              <button
                type="button"
                onClick={toggleViewMode}
                className={`px-3 py-1 text-sm font-medium rounded-md ml-1 ${
                  !sideBySide
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Inline
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-grow">
        <DiffEditor
          height="100%"
          language={language}
          original={v8Output}
          modified={quickjsOutput}
          options={{
            renderSideBySide: sideBySide,
            originalEditable: false,
            readOnly: true,
          }}
        />
      </div>
    </div>
  )
}
