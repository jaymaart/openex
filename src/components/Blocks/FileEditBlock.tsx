import React, { useState } from 'react'
import { diffLines } from 'diff'
import type { ToolResult } from '../../../../shared/types'

export function FileEditBlock({ toolResult }: { toolResult: ToolResult }) {
  const [expanded, setExpanded] = useState(true)

  const { output, error, originalContent } = toolResult
  const newContent = error ? '' : output.replace(/^Written .+\n?/, '')

  // If we have both original and new content, show a diff
  const hasDiff = originalContent !== undefined

  return (
    <div className="my-1 rounded-xl border border-white/10 bg-zinc-900/50 text-xs font-mono">
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <span>✏️</span>
        <span className="text-zinc-300 font-medium">File written</span>
        <span className="text-zinc-500 truncate">{toolResult.output.split('\n')[0]}</span>
        {error && <span className="text-red-400 ml-auto">error</span>}
        <span className={`${error ? '' : 'ml-auto'} text-zinc-600`}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="border-t border-white/5 px-3 py-2 max-h-64 overflow-auto">
          {error ? (
            <pre className="text-red-400">{error}</pre>
          ) : hasDiff ? (
            <DiffView original={originalContent!} updated={newContent} />
          ) : (
            <pre className="text-green-400 whitespace-pre-wrap">{toolResult.output}</pre>
          )}
        </div>
      )}
    </div>
  )
}

function DiffView({ original, updated }: { original: string; updated: string }) {
  const parts = diffLines(original, updated)
  return (
    <div>
      {parts.map((part, i) => {
        const color = part.added
          ? 'text-green-400 bg-green-950/40'
          : part.removed
          ? 'text-red-400 bg-red-950/40'
          : 'text-zinc-500'
        const prefix = part.added ? '+' : part.removed ? '-' : ' '
        return (
          <pre key={i} className={`${color} whitespace-pre-wrap`}>
            {part.value.split('\n').filter((_, idx, arr) => idx < arr.length - 1 || part.value.endsWith('\n') || idx === 0).map((line, j) => (
              <span key={j} className="block">{prefix} {line}</span>
            ))}
          </pre>
        )
      })}
    </div>
  )
}
