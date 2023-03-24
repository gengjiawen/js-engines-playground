import React from 'react'
import CodeMirror, { ReactCodeMirrorProps } from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { vim } from '@replit/codemirror-vim'

interface EditorProps {
  extra?: ReactCodeMirrorProps
  code?: string
  onChange?: (code: string) => void
}

export function Editor(editorProps?: EditorProps) {
  return (
    <CodeMirror
      {...editorProps?.extra}
      value={editorProps?.code}
      height="100%"
      extensions={[vim(), javascript({ jsx: true })]}
      onChange={editorProps?.onChange}
    />
  )
}
