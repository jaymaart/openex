import Anthropic from '@anthropic-ai/sdk'
import type { Provider, ToolDefinition } from './types'
import type { ConversationMessage, AgentEvent, ToolCall, ToolCallArgs } from '../../shared/types'

function toAnthropicMessages(messages: ConversationMessage[]): Anthropic.MessageParam[] {
  const result: Anthropic.MessageParam[] = []

  for (const msg of messages) {
    if (msg.role === 'user') {
      result.push({ role: 'user', content: msg.content })
    } else if (msg.role === 'assistant') {
      const content: Anthropic.ContentBlock[] = []
      if (msg.content) content.push({ type: 'text', text: msg.content })
      if (msg.toolCalls?.length) {
        for (const tc of msg.toolCalls) {
          content.push({
            type: 'tool_use',
            id: tc.id,
            name: tc.name,
            input: tc.args
          })
        }
      }
      result.push({ role: 'assistant', content })
    } else if (msg.role === 'tool') {
      result.push({
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: msg.toolCallId, content: msg.content }]
      })
    }
  }

  return result
}

export function createAnthropicProvider(apiKey: string, model: string): Provider {
  const client = new Anthropic({ apiKey })

  return {
    async stream(messages, tools, onEvent) {
      const anthropicTools: Anthropic.Tool[] = tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters
      }))

      // Separate system message if first message is a system-style user message
      const anthropicMessages = toAnthropicMessages(messages)

      const stream = client.messages.stream({
        model,
        max_tokens: 8096,
        tools: anthropicTools.length ? anthropicTools : undefined,
        messages: anthropicMessages
      })

      const toolCallAccum: Record<string, { id: string; name: string; args: string }> = {}

      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            onEvent({ type: 'text_delta', delta: event.delta.text })
          } else if (event.delta.type === 'input_json_delta') {
            const key = String(event.index)
            if (toolCallAccum[key]) {
              toolCallAccum[key].args += event.delta.partial_json
            }
          }
        } else if (event.type === 'content_block_start') {
          if (event.content_block.type === 'tool_use') {
            const key = String(event.index)
            toolCallAccum[key] = {
              id: event.content_block.id,
              name: event.content_block.name,
              args: ''
            }
          }
        } else if (event.type === 'message_delta') {
          if (event.delta.stop_reason === 'tool_use' || event.delta.stop_reason === 'end_turn') {
            for (const tc of Object.values(toolCallAccum)) {
              let args: ToolCallArgs = {}
              try { args = JSON.parse(tc.args) } catch { /* ignore */ }
              const toolCall: ToolCall = {
                id: tc.id,
                name: tc.name as ToolCall['name'],
                args
              }
              onEvent({ type: 'tool_call', toolCall })
            }
          }
        }
      }
    }
  }
}
