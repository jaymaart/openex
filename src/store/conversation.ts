import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { UIMessage, ToolCall, ToolResult } from '../../shared/types'

// nanoid is tiny — inline it to avoid the dep
function id() { return Math.random().toString(36).slice(2, 10) }

interface ConversationStore {
  messages: UIMessage[]
  isStreaming: boolean
  pendingApprovalId: string | null // toolCallId awaiting approval

  addUserMessage: (content: string) => void
  startAssistantMessage: () => string  // returns message id
  appendDelta: (msgId: string, delta: string) => void
  addToolCall: (toolCall: ToolCall) => string  // returns message id
  setApprovalState: (toolCallId: string, state: UIMessage['approvalState']) => void
  addToolResult: (toolResult: ToolResult) => void
  setStreaming: (v: boolean) => void
  setPendingApproval: (toolCallId: string | null) => void
  reset: () => void
}

export const useConversationStore = create<ConversationStore>((set, get) => ({
  messages: [],
  isStreaming: false,
  pendingApprovalId: null,

  addUserMessage: (content) =>
    set((s) => ({
      messages: [...s.messages, { id: id(), type: 'user', content }]
    })),

  startAssistantMessage: () => {
    const msgId = id()
    set((s) => ({
      messages: [...s.messages, { id: msgId, type: 'assistant', content: '' }]
    }))
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
      messages: [...s.messages, {
        id: msgId,
        type: 'tool_call',
        toolCall,
        approvalState: 'pending'
      }]
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
    set((s) => ({
      messages: [...s.messages, { id: id(), type: 'tool_result', toolResult }]
    })),

  setStreaming: (v) => set({ isStreaming: v }),

  setPendingApproval: (toolCallId) => set({ pendingApprovalId: toolCallId }),

  reset: () => set({ messages: [], isStreaming: false, pendingApprovalId: null })
}))
