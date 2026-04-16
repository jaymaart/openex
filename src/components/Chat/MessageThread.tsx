import React, { useEffect, useRef } from 'react'
import { useConversationStore } from '../../store/conversation'
import { UserMessage } from './UserMessage'
import { AssistantMessage } from './AssistantMessage'
import { ToolCallBlock } from '../Blocks/ToolCallBlock'
import { FileEditBlock } from '../Blocks/FileEditBlock'
import { ShellOutputBlock } from '../Blocks/ShellOutputBlock'

export function MessageThread() {
  const { messages, isStreaming } = useConversationStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isStreaming])

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {messages.length === 0 && (
        <div className="flex h-full items-center justify-center">
          <div className="text-center text-zinc-600">
            <p className="text-2xl mb-2">OpenEx</p>
            <p className="text-sm">Open-source coding agent. Powered by open models.</p>
          </div>
        </div>
      )}

      {messages.map((msg) => {
        if (msg.type === 'user') {
          return <UserMessage key={msg.id} content={msg.content ?? ''} />
        }
        if (msg.type === 'assistant') {
          return (
            <div key={msg.id}>
              <AssistantMessage content={msg.content ?? ''} />
              {isStreaming && msg.id === messages.filter(m => m.type === 'assistant').at(-1)?.id && (
                <span className="inline-block w-1.5 h-4 bg-blue-400 animate-pulse ml-0.5 rounded-sm" />
              )}
            </div>
          )
        }
        if (msg.type === 'tool_call' && msg.toolCall) {
          return (
            <ToolCallBlock
              key={msg.id}
              toolCall={msg.toolCall}
              approvalState={msg.approvalState}
            />
          )
        }
        if (msg.type === 'tool_result' && msg.toolResult) {
          if (msg.toolResult.toolName === 'write_file') {
            return <FileEditBlock key={msg.id} toolResult={msg.toolResult} />
          }
          if (msg.toolResult.toolName === 'shell') {
            return <ShellOutputBlock key={msg.id} toolResult={msg.toolResult} />
          }
          // read_file / list_dir — show inline collapsible
          return <ReadResultBlock key={msg.id} output={msg.toolResult.output} toolName={msg.toolResult.toolName} />
        }
        return null
      })}

      <div ref={bottomRef} />
    </div>
  )
}

function ReadResultBlock({ output, toolName }: { output: string; toolName: string }) {
  const [expanded, setExpanded] = React.useState(false)
  const icon = toolName === 'list_dir' ? '📁' : '📄'
  const label = toolName === 'list_dir' ? 'Directory listing' : 'File contents'
  return (
    <div className="my-1 rounded-xl border border-white/10 bg-zinc-900/50 text-xs font-mono">
      <div className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none" onClick={() => setExpanded(v => !v)}>
        <span>{icon}</span>
        <span className="text-zinc-400">{label}</span>
        <span className="ml-auto text-zinc-600">{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && (
        <div className="border-t border-white/5 px-3 py-2 max-h-48 overflow-auto">
          <pre className="text-zinc-400 whitespace-pre-wrap">{output}</pre>
        </div>
      )}
    </div>
  )
}
