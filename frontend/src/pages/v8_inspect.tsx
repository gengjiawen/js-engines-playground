import React, { useEffect, useMemo, useState } from 'react'
import debounce from 'lodash.debounce'
import { Editor } from '../Editor'
import { getUrl } from '../utils/url_utils'

export function V8_INSPECT_PAGE() {
  let code = `function add(a, b) { \n return a + b; \n}\n`
  let [editor_value] = useState(code)
  const editorOnchange = (value: string) => {
    console.log(value)
    editor_value = value
    debouncedChangeHandler()
    console.log(`change finished`)
  }

  let [flag_value, setFlagValue] = useState('--print-bytecode')
  const flagsOnChange = (event: any) => {
    flag_value = event.target.value
    setFlagValue(flag_value)
    debouncedChangeHandler()
  }

  let [compiler_out, setCompilerout] = useState('')
  const getRes = () => {
    console.warn(`submit code to server`, editor_value)
    let formdata = new FormData()
    formdata.append('js_code', editor_value)
    formdata.append('flags', flag_value)

    let requestOptions = {
      method: 'POST',
      body: formdata,
    }

    const url = getUrl('v8')
    console.log(url)
    fetch(url, requestOptions)
      .then((response) => response.text())
      .then((result) => {
        let out = JSON.parse(result).stdout
        setCompilerout(out)
      })
      .catch((error) => console.log('error', error))
  }

  const debouncedChangeHandler = useMemo(() => debounce(getRes, 500), [getRes])

  useEffect(() => {
    getRes()
  }, [])

  return (
    <div className="flex h-screen">
      <div className="w-1/2">
        <Editor onChange={editorOnchange} code={editor_value} />
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
            value={flag_value}
            onChange={flagsOnChange}
          />
        </div>

        <Editor
          code={compiler_out}
          extra={{ readOnly: true, editable: false }}
        />
      </div>
    </div>
  )
}
