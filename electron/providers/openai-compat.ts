import OpenAI from 'openai'
import type { Provider, ToolDefinition } from './types'
import type { ConversationMessage, AgentEvent, ToolCall, ToolCallArgs } from '../../shared/types'

function toOpenAIMessages(messages: ConversationMessage[]): OpenAI.ChatCompletionMessageParam[] {
  return messages.map((msg) => {
    if (msg.role === 'user') {
      return { role: 'user', content: msg.content }
    }
    if (msg.role === 'assistant') {
      const m: OpenAI.ChatCompletionAssistantMessageParam = { role: 'assistant', content: msg.content || '' }
      if (msg.toolCalls?.length) {
        m.tool_calls = msg.toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function' as const,
          function: { name: tc.name, arguments: JSON.stringify(tc.args) }
        }))
      }
      return m
    }
    // tool result
    return {
      role: 'tool' as const,
      tool_call_id: msg.toolCallId,
      content: msg.content
    }
  })
}

export function createOpenAICompatProvider(baseUrl: string, apiKey: string, model: string): Provider {
  const client = new OpenAI({ baseURL: baseUrl, apiKey: apiKey || 'no-key' })

  return {
    async stream(messages, tools, onEvent) {
      const openaiTools: OpenAI.ChatCompletionTool[] = tools.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters
        }
      }))

      const stream = await client.chat.completions.create({
        model,
        messages: toOpenAIMessages(messages),
        tools: openaiTools.length ? openaiTools : undefined,
        tool_choice: openaiTools.length ? 'auto' : undefined,
        stream: true
      })

      // Accumulate tool call deltas
      const toolCallAccum: Record<number, { id: string; name: string; args: string }> = {}
      let textAccum = ''

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta
        if (!delta) continue

        if (delta.content) {
          textAccum += delta.content
          onEvent({ type: 'text_delta', delta: delta.content })
        }

        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index
            if (!toolCallAccum[idx]) {
              toolCallAccum[idx] = { id: tc.id ?? '', name: tc.function?.name ?? '', args: '' }
            }
            if (tc.id) toolCallAccum[idx].id = tc.id
            if (tc.function?.name) toolCallAccum[idx].name = tc.function.name
            if (tc.function?.arguments) toolCallAccum[idx].args += tc.function.arguments
          }
        }

        const finishReason = chunk.choices[0]?.finish_reason
        if (finishReason === 'tool_calls' || finishReason === 'stop') {
          // Emit complete tool calls
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
