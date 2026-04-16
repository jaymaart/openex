import React, { useState, useRef, useEffect } from 'react'
import { trpc } from '../../lib/trpc'
import { useConversationStore } from '../../store/conversation'
import type { AgentEvent } from '../../../../shared/types'

export function MessageInput() {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const {
    isStreaming,
    pendingApprovalId,
    addUserMessage,
    startAssistantMessage,
    appendDelta,
    addToolCall,
    setApprovalState,
    addToolResult,
    setStreaming,
    setPendingApproval
  } = useConversationStore()

  const utils = trpc.useContext()
  const chatSubscription = trpc.agent.chat.useSubscription

  // We manage the subscription manually via a ref to avoid stale closures
  const subscriptionRef = useRef<ReturnType<typeof chatSubscription> | null>(null)

  const disabled = isStreaming || !!pendingApprovalId

  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [disabled])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleSubmit = () => {
    const msg = text.trim()
    if (!msg || disabled) return
    setText('')
    sendMessage(msg)
  }

  const sendMessage = (message: string) => {
    addUserMessage(message)
    setStreaming(true)

    let currentAssistantId: string | null = null

    // Use tRPC subscription directly
    const sub = trpc.agent.chat.subscribe(
      { message },
      {
        onData(event: AgentEvent) {
          if (event.type === 'text_delta') {
            if (!currentAssistantId) {
              currentAssistantId = startAssistantMessage()
            }
            appendDelta(currentAssistantId, event.delta ?? '')
          } else if (event.type === 'tool_call' && event.toolCall) {
            currentAssistantId = null // next text starts a new message
            addToolCall(event.toolCall)
          } else if (event.type === 'approval_request' && event.toolCall) {
            setApprovalState(event.toolCall.id, 'pending')
            setPendingApproval(event.toolCall.id)
          } else if (event.type === 'tool_result' && event.toolResult) {
            const tc = event.toolResult
            setApprovalState(tc.toolCallId, 'done')
            addToolResult(tc)
          } else if (event.type === 'done' || event.type === 'error') {
            setStreaming(false)
            setPendingApproval(null)
          }
        },
        onError(err) {
          console.error('Agent error:', err)
          setStreaming(false)
          setPendingApproval(null)
        }
      }
    )
  }

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }, [text])

  return (
    <div className="flex-shrink-0 border-t border-white/10 bg-[#111] px-4 py-3">
      <div
        className={`flex items-end gap-2 rounded-xl border px-3 py-2 transition-colors ${
          disabled
            ? 'border-white/5 bg-zinc-900/50 opacity-60'
            : 'border-white/10 bg-zinc-900 focus-within:border-blue-500/50'
        }`}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={
            pendingApprovalId
              ? 'Waiting for approval…'
              : isStreaming
              ? 'Agent is thinking…'
              : 'Message OpenEx… (Enter to send, Shift+Enter for newline)'
          }
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none min-h-[1.5rem] max-h-40"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !text.trim()}
          className="mb-0.5 flex-shrink-0 rounded-lg bg-blue-600 p-1.5 text-white disabled:opacity-30 hover:bg-blue-500 transition-colors"
        >
          <SendIcon />
        </button>
      </div>
      <p className="mt-1.5 text-center text-xs text-zinc-700">
        OpenEx can make mistakes. Review file writes and shell commands carefully.
      </p>
    </div>
  )
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}
