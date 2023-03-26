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
      <div className="px-4 py-5 sm:p-6"> {content} </div>
    </div>
  )
}
