import React from 'react'

export function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-2.5 text-sm text-white leading-relaxed whitespace-pre-wrap">
        {content}
      </div>
    </div>
  )
}
