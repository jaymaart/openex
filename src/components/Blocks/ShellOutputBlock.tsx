import React, { useState } from 'react'
import type { ToolResult } from '../../../../shared/types'

export function ShellOutputBlock({ toolResult }: { toolResult: ToolResult }) {
  const [expanded, setExpanded] = useState(true)
  const { output, exitCode, error } = toolResult
  const success = exitCode === 0 || exitCode === undefined

  return (
    <div className="my-1 rounded-xl border border-white/10 bg-zinc-900/50 text-xs font-mono">
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <span>⚡</span>
        <span className="text-zinc-300 font-medium">Shell output</span>
        <span
          className={`ml-auto rounded px-1.5 py-0.5 text-xs font-medium ${
            success ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
          }`}
        >
          exit {exitCode ?? 0}
        </span>
        <span className="text-zinc-600 ml-1">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="border-t border-white/5 px-3 py-2 max-h-48 overflow-auto">
          <pre className={`whitespace-pre-wrap ${success ? 'text-zinc-300' : 'text-red-300'}`}>
            {output || error || '(no output)'}
          </pre>
        </div>
      )}
    </div>
  )
}
