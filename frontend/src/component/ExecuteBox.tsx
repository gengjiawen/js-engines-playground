import { Editor } from "../Editor"

export function ExecuteBox({
  title,
  content,
}: {
  title: string
  content: string
}) {
  return (
    <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow">
      <div className="px-4 py-5 sm:px-6">{title}</div>
        <Editor
          code={content}
        />
    </div>
  )
}
