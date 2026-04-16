// ─── Config ──────────────────────────────────────────────────────────────────

export interface OpenAICompatConfig {
  baseUrl: string
  apiKey: string
  model: string
}

export interface AnthropicConfig {
  apiKey: string
  model: string
}

export type ApprovalMode = 'auto' | 'manual' | 'smart'

export interface Config {
  activeProvider: 'openai-compat' | 'anthropic'
  providers: {
    'openai-compat': OpenAICompatConfig
    'anthropic': AnthropicConfig
  }
  approval: ApprovalMode
  workingDir: string
}

// ─── Conversation ─────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'tool'

export interface ToolCallArgs {
  path?: string
  content?: string
  command?: string
}

export interface ToolCall {
  id: string
  name: 'read_file' | 'list_dir' | 'write_file' | 'shell'
  args: ToolCallArgs
}

export interface ToolResult {
  toolCallId: string
  toolName: string
  output: string
  exitCode?: number
  error?: string
  /** For write_file: original content before overwrite */
  originalContent?: string
}

// Normalized message format shared between main and renderer
export type ConversationMessage =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string; toolCalls?: ToolCall[] }
  | { role: 'tool'; toolCallId: string; toolName: string; content: string }

// ─── Agent Events (streamed from main → renderer) ────────────────────────────

export type AgentEventType =
  | 'text_delta'       // streaming text token
  | 'tool_call'        // model emitted a complete tool call
  | 'approval_request' // needs user approval before executing
  | 'tool_result'      // tool finished executing
  | 'done'             // loop complete
  | 'error'            // unrecoverable error

export interface AgentEvent {
  type: AgentEventType
  delta?: string           // text_delta
  toolCall?: ToolCall      // tool_call | approval_request
  toolResult?: ToolResult  // tool_result
  error?: string           // error
}

// ─── UI Message types (renderer-only, derived from AgentEvents) ───────────────

export type UIMessageType =
  | 'user'
  | 'assistant'
  | 'tool_call'
  | 'tool_result'
  | 'error'

export interface UIMessage {
  id: string
  type: UIMessageType
  // user / assistant text
  content?: string
  // tool call
  toolCall?: ToolCall
  approvalState?: 'pending' | 'approved' | 'rejected' | 'running' | 'done'
  // tool result
  toolResult?: ToolResult
}
