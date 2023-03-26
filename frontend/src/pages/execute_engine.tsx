import React, { useEffect, useMemo, useState } from "react";
import { Editor } from "../Editor";
import { ExecuteBox } from "../component/ExecuteBox";
import debounce from "lodash.debounce";
import { getUrl } from "../utils/url_utils";

export function ExecuteEnginePage() {
  let code = `print('hi')`
  let [editor_value] = useState(code)
  const editorOnchange = (value: string) => {
    console.log(value)
    editor_value = value
    debouncedChangeHandler()
    console.log(`change finished`)
  }

  let [v8_output, set_v8_output] = useState('')
  let [quickjs_output, set_quickjs] = useState('')
  const getRes = () => {
    if (editor_value.trim() == '') {
      set_v8_output('')
      set_quickjs('')
      return
    }
    console.warn(`submmit code to server`, editor_value)
    let formdata = new FormData()
    formdata.append('js_code', editor_value)
    formdata.append('flags', '')

    let requestOptions = {
      method: 'POST',
      body: formdata,
    }

    let url = getUrl('v8')
    fetch(url, requestOptions)
      .then((response) => response.json())
      .then((result) => {
        set_v8_output(result.stdout)
      })
      .catch((error) => console.log('error', error))

    fetch(getUrl('quickjs'), requestOptions)
      .then((response) => response.json())
      .then((result) => {
        set_quickjs(result.stdout)
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
        <Editor code={editor_value} onChange={editorOnchange} />
      </div>
      <div className="w-1/2">
        <ExecuteBox title={"V8 result"} content={v8_output} />
        <div className="border-b-2 border-gray-300 my-4"></div>
        <ExecuteBox title={'Quickjs result'} content={quickjs_output} />
      </div>
    </div>
  )
}
