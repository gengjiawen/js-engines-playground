import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Grid,
  GridItem,
  HStack,
  Input,
  Text,
  useFocusEffect,
} from '@chakra-ui/react'
import { Editor } from './Editor'
import debounce from 'lodash.debounce'

function App() {
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
    console.warn(`submmit code to server`, editor_value)
    let formdata = new FormData()
    formdata.append('js_code', editor_value)
    formdata.append('flags', flag_value)

    let requestOptions = {
      method: 'POST',
      body: formdata,
    }

    let url = 'http://localhost:8000/v8'
    let location = window.location.href
    let prod = import.meta.env.PROD
    if (prod) {
      url = '/v8'
    }
    // console.log(`location`, location)
    if (location.includes('gitpod.io')) {
      url = location.replace('3000', '8000') + 'v8'
    }
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
    <Grid templateColumns="repeat(2, 1fr)" height="100vh" gap={6}>
      <Editor onChange={editorOnchange} code={editor_value} />
      <GridItem w="100%" h="50%">
        <HStack>
          <Text>Flags:</Text>
          <Input value={flag_value} onChange={flagsOnChange} />
        </HStack>
        <Editor
          code={compiler_out}
          extra={{ readOnly: true, editable: false }}
        />
      </GridItem>
    </Grid>
  )
}

export default App
