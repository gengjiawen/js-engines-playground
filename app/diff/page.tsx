'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useState } from 'react'
import debounce from 'lodash.debounce'
import { getUrl } from '@/lib/getUrl'
import { Editor } from '@/components/Editor'

const DiffEditor = dynamic(
  () => import('@monaco-editor/react').then((m) => m.DiffEditor),
  { ssr: false }
)

const ENGINES = {
  v8: {
    name: 'V8',
    endpoint: 'v8',
    defaultFlags: '--print-bytecode',
  },
  jsc: {
    name: 'JavaScriptCore',
    endpoint: 'jsc',
    defaultFlags: '-d',
  },
  'qjs-debug': {
    name: 'QuickJS',
    endpoint: 'qjs-debug',
    defaultFlags: '-D1',
  },
}

type EngineKey = keyof typeof ENGINES

export default function DiffEnginePage() {
  const [jsCode, setJsCode] = useState(
    `// Enter your JavaScript code here\nconsole.log('Hello, world!');\n`
  )
  const [leftEngine, setLeftEngine] = useState<EngineKey>('v8')
  const [rightEngine, setRightEngine] = useState<EngineKey>('qjs-debug')
  const [leftOutput, setLeftOutput] = useState('')
  const [rightOutput, setRightOutput] = useState('')
  const [leftFlags, setLeftFlags] = useState(ENGINES.v8.defaultFlags)
  const [rightFlags, setRightFlags] = useState(
    ENGINES['qjs-debug'].defaultFlags
  )
  const [language] = useState('javascript')
  const [sideBySide, setSideBySide] = useState(true)

  const toggleViewMode = () => {
    setSideBySide(!sideBySide)
  }

  const executeEngine = useCallback(
    (
      engine: EngineKey,
      flags: string,
      setOutput: React.Dispatch<React.SetStateAction<string>>
    ) => {
      if (jsCode.trim() === '') {
        setOutput('')
        return
      }

      const formdata = new FormData()
      formdata.append('js_code', jsCode)
      formdata.append('flags', flags)

      fetch(getUrl(ENGINES[engine].endpoint), {
        method: 'POST',
        body: formdata,
      })
        .then((response) => response.text())
        .then((result) => {
          const out = JSON.parse(result).stdout
          setOutput(out)
        })
        .catch((error) => {
          console.log('error', error)
          setOutput(`Error executing ${ENGINES[engine].name}: ${error.message}`)
        })
    },
    [jsCode]
  )

  const executeCode = useCallback(
    (
      currentLeftEngine: EngineKey = leftEngine,
      currentRightEngine: EngineKey = rightEngine,
      currentLeftFlags: string = leftFlags,
      currentRightFlags: string = rightFlags
    ) => {
      if (jsCode.trim() === '') {
        setLeftOutput('')
        setRightOutput('')
        return
      }

      executeEngine(currentLeftEngine, currentLeftFlags, setLeftOutput)
      executeEngine(currentRightEngine, currentRightFlags, setRightOutput)
    },
    [executeEngine, jsCode, leftEngine, leftFlags, rightEngine, rightFlags]
  )

  const debouncedExecuteCode = useMemo(
    () => debounce(() => executeCode(), 500),
    [executeCode]
  )

  useEffect(() => {
    executeCode()
    return () => {
      debouncedExecuteCode.cancel()
    }
  }, [debouncedExecuteCode, executeCode])

  return (
    <div className="flex flex-col h-screen">
      <div className="p-2 bg-white">
        <h1 className="text-lg font-medium text-gray-700">JavaScript Input</h1>
      </div>
      <div>
        <Editor
          code={jsCode}
          onChange={(value) => {
            setJsCode(value)
            debouncedExecuteCode()
          }}
        />
      </div>

      <div className="flex p-2 bg-white">
        <div className="w-1/2 pr-2">
          <div className="mb-2">
            <label
              htmlFor="left-engine"
              className="block text-sm font-medium text-gray-700"
            >
              Left Engine
            </label>
            <select
              id="left-engine"
              name="left-engine"
              className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              value={leftEngine}
              onChange={(event) => {
                const engine = event.target.value as EngineKey
                setLeftEngine(engine)
                setLeftFlags(ENGINES[engine].defaultFlags)
                setTimeout(
                  () =>
                    executeCode(
                      engine,
                      rightEngine,
                      ENGINES[engine].defaultFlags,
                      rightFlags
                    ),
                  0
                )
              }}
            >
              {Object.entries(ENGINES).map(([key, engine]) => (
                <option
                  key={key}
                  value={key}
                >
                  {engine.name}
                </option>
              ))}
            </select>
          </div>
          <label
            htmlFor="left-flags"
            className="block text-sm font-medium text-gray-700"
          >
            {ENGINES[leftEngine].name} Flags
          </label>
          <div className="mt-1">
            <input
              id="left-flags"
              name="left-flags"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={leftFlags}
              onChange={(event) => {
                const newFlags = event.target.value
                setLeftFlags(newFlags)
                debouncedExecuteCode()
              }}
            />
          </div>
        </div>
        <div className="w-1/2 pl-2">
          <div className="mb-2">
            <label
              htmlFor="right-engine"
              className="block text-sm font-medium text-gray-700"
            >
              Right Engine
            </label>
            <select
              id="right-engine"
              name="right-engine"
              className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              value={rightEngine}
              onChange={(event) => {
                const engine = event.target.value as EngineKey
                setRightEngine(engine)
                setRightFlags(ENGINES[engine].defaultFlags)
                setTimeout(
                  () =>
                    executeCode(
                      leftEngine,
                      engine,
                      leftFlags,
                      ENGINES[engine].defaultFlags
                    ),
                  0
                )
              }}
            >
              {Object.entries(ENGINES).map(([key, engine]) => (
                <option
                  key={key}
                  value={key}
                >
                  {engine.name}
                </option>
              ))}
            </select>
          </div>
          <label
            htmlFor="right-flags"
            className="block text-sm font-medium text-gray-700"
          >
            {ENGINES[rightEngine].name} Flags
          </label>
          <div className="mt-1">
            <input
              id="right-flags"
              name="right-flags"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={rightFlags}
              onChange={(event) => {
                const newFlags = event.target.value
                setRightFlags(newFlags)
                debouncedExecuteCode()
              }}
            />
          </div>
        </div>
      </div>

      <div className="p-2 bg-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-medium text-gray-700">
              Engine Diff Editor: {ENGINES[leftEngine].name} vs{' '}
              {ENGINES[rightEngine].name}
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
          original={leftOutput}
          modified={rightOutput}
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
