import { create } from 'zustand'
import type { UIMessage, ToolCall, ToolResult } from '../../shared/types'

function id() { return Math.random().toString(36).slice(2, 10) }

interface ConversationStore {
  messages: UIMessage[]
  isStreaming: boolean
  pendingApprovalId: string | null

  addUserMessage: (content: string) => void
  startAssistantMessage: () => string
  appendDelta: (msgId: string, delta: string) => void
  addToolCall: (toolCall: ToolCall) => string
  setApprovalState: (toolCallId: string, state: UIMessage['approvalState']) => void
  addToolResult: (toolResult: ToolResult) => void
  addErrorMessage: (error: string) => void
  setStreaming: (v: boolean) => void
  setPendingApproval: (toolCallId: string | null) => void
  reset: () => void
}

export const useConversationStore = create<ConversationStore>((set) => ({
  messages: [],
  isStreaming: false,
  pendingApprovalId: null,

  addUserMessage: (content) =>
    set((s) => ({ messages: [...s.messages, { id: id(), type: 'user', content }] })),

  startAssistantMessage: () => {
    const msgId = id()
    set((s) => ({ messages: [...s.messages, { id: msgId, type: 'assistant', content: '' }] }))
    return msgId
  },

  appendDelta: (msgId, delta) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === msgId ? { ...m, content: (m.content ?? '') + delta } : m
      )
    })),

  addToolCall: (toolCall) => {
    const msgId = id()
    set((s) => ({
      messages: [...s.messages, { id: msgId, type: 'tool_call', toolCall, approvalState: 'pending' }]
    }))
    return msgId
  },

  setApprovalState: (toolCallId, state) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.toolCall?.id === toolCallId ? { ...m, approvalState: state } : m
      )
    })),

  addToolResult: (toolResult) =>
    set((s) => ({ messages: [...s.messages, { id: id(), type: 'tool_result', toolResult }] })),

  // Renders as a red error bubble in the thread
  addErrorMessage: (error) =>
    set((s) => ({ messages: [...s.messages, { id: id(), type: 'error' as UIMessage['type'], content: error }] })),

  setStreaming: (v) => set({ isStreaming: v }),

  setPendingApproval: (toolCallId) => set({ pendingApprovalId: toolCallId }),

  reset: () => set({ messages: [], isStreaming: false, pendingApprovalId: null })
}))
