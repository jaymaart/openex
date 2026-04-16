import React, { useState } from 'react'
import { api } from '../../lib/api'
import { useConversationStore } from '../../store/conversation'
import type { ToolCall, UIMessage } from '../../../../shared/types'

const TOOL_ICONS: Record<string, string> = {
  read_file: '📄',
  list_dir: '📁',
  write_file: '✏️',
  shell: '⚡'
}

const TOOL_LABELS: Record<string, string> = {
  read_file: 'Read file',
  list_dir: 'List directory',
  write_file: 'Write file',
  shell: 'Run command'
}

export function ToolCallBlock({
  toolCall,
  approvalState
}: {
  toolCall: ToolCall
  approvalState: UIMessage['approvalState']
}) {
  const [expanded, setExpanded] = useState(false)
  const { setApprovalState, setPendingApproval } = useConversationStore()

  const handleApprove = () => {
    setApprovalState(toolCall.id, 'running')
    setPendingApproval(null)
    api.respondToApproval(toolCall.id, true)
  }

  const handleReject = () => {
    setApprovalState(toolCall.id, 'rejected')
    setPendingApproval(null)
    api.respondToApproval(toolCall.id, false)
  }

  const icon = TOOL_ICONS[toolCall.name] ?? '🔧'
  const label = TOOL_LABELS[toolCall.name] ?? toolCall.name
  const primaryArg = toolCall.args.path ?? toolCall.args.command ?? ''

  return (
    <div
      className={`my-1 rounded-xl border text-xs font-mono transition-all ${
        approvalState === 'pending'
          ? 'border-amber-500/50 bg-amber-950/30 ring-1 ring-amber-500/30'
          : approvalState === 'rejected'
          ? 'border-red-800/40 bg-red-950/20'
          : 'border-white/10 bg-zinc-900/50'
      }`}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <span>{icon}</span>
        <span className="text-zinc-300 font-medium">{label}</span>
        {primaryArg && <span className="text-zinc-500 truncate max-w-xs">{primaryArg}</span>}

        {approvalState === 'running' && (
          <span className="ml-auto text-blue-400 animate-pulse text-xs">running…</span>
        )}
        {approvalState === 'done' && <span className="ml-auto text-green-500 text-xs">✓ done</span>}
        {approvalState === 'rejected' && <span className="ml-auto text-red-400 text-xs">rejected</span>}
        {!['running', 'done', 'rejected'].includes(approvalState ?? '') && (
          <span className="ml-auto text-zinc-600">{expanded ? '▲' : '▼'}</span>
        )}
      </div>

      {/* Expanded args */}
      {expanded && (
        <div className="border-t border-white/5 px-3 py-2">
          <pre className="text-zinc-400 whitespace-pre-wrap text-xs">
            {JSON.stringify(toolCall.args, null, 2)}
          </pre>
        </div>
      )}

      {/* Approval buttons */}
      {approvalState === 'pending' && (
        <div className="border-t border-amber-500/20 px-3 py-2 flex items-center gap-2">
          <span className="text-amber-400 text-xs mr-auto">Approval required</span>
          <button
            onClick={handleReject}
            className="rounded-md px-3 py-1 text-xs text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            Reject
          </button>
          <button
            onClick={handleApprove}
            className="rounded-md bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-500 transition-colors"
          >
            Approve
          </button>
        </div>
      )}
    </div>
  )
}
