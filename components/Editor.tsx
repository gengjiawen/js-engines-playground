'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import type { ReactCodeMirrorProps } from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { vim } from '@replit/codemirror-vim'

const CodeMirror = dynamic<ReactCodeMirrorProps>(
  () => import('@uiw/react-codemirror').then((m) => m.default),
  { ssr: false }
)

export interface EditorProps {
  extra?: ReactCodeMirrorProps
  code?: string
  onChange?: (code: string) => void
}

export function Editor(props: EditorProps) {
  const extensions = useMemo(() => {
    return [vim(), javascript({ jsx: true })]
  }, [])

  return (
    <CodeMirror
      {...props.extra}
      value={props.code}
      height="100%"
      extensions={extensions}
      onChange={props.onChange}
    />
  )
}
