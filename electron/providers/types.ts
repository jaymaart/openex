import type { ConversationMessage, AgentEvent } from '../../shared/types'

export interface ToolDefinition {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, { type: string; description: string }>
    required: string[]
  }
}

export interface Provider {
  stream(
    messages: ConversationMessage[],
    tools: ToolDefinition[],
    onEvent: (event: AgentEvent) => void
  ): Promise<void>
}
