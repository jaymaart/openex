import type { ConversationMessage, AgentEvent, ToolCall } from '../../shared/types'
import { getConfig } from '../config/store'
import { getProvider } from '../providers'
import { tools } from '../tools'
import { requestApproval } from './approval'

const SYSTEM_PROMPT = `You are OpenEx, an expert coding assistant. You have access to tools to read files, list directories, write files, and run shell commands.

Guidelines:
- Prefer reading files before editing them.
- Make targeted, minimal edits — avoid rewriting entire files unnecessarily.
- When writing files, always provide the complete file content.
- Before running destructive commands, explain what you're about to do.
- If unsure about anything, ask the user for clarification.`

// In-memory conversation per session (reset on app restart)
let history: ConversationMessage[] = [
  { role: 'user', content: SYSTEM_PROMPT },
  { role: 'assistant', content: 'Understood. I\'m ready to help with your code.' }
]

export function resetHistory(): void {
  history = [
    { role: 'user', content: SYSTEM_PROMPT },
    { role: 'assistant', content: 'Understood. I\'m ready to help with your code.' }
  ]
}

export async function runAgentLoop(
  userMessage: string,
  onEvent: (event: AgentEvent) => void
): Promise<void> {
  const config = getConfig()
  const provider = getProvider(config)
  const { workingDir } = config

  history.push({ role: 'user', content: userMessage })

  const toolDefs = Object.values(tools).map((t) => t.definition)

  // Loop until the model responds with no tool calls
  while (true) {
    const pendingToolCalls: ToolCall[] = []
    let assistantText = ''

    await provider.stream(history, toolDefs, (event) => {
      if (event.type === 'text_delta') {
        assistantText += event.delta ?? ''
        onEvent(event)
      } else if (event.type === 'tool_call' && event.toolCall) {
        pendingToolCalls.push(event.toolCall)
      }
    })

    // Append assistant turn to history
    history.push({
      role: 'assistant',
      content: assistantText,
      toolCalls: pendingToolCalls.length ? pendingToolCalls : undefined
    })

    if (!pendingToolCalls.length) break // Done — pure text response

    // Process each tool call sequentially
    for (const toolCall of pendingToolCalls) {
      // Emit the tool call so UI can show it
      onEvent({ type: 'tool_call', toolCall })

      // Check approval
      const needsApproval = toolCall.name === 'write_file' || toolCall.name === 'shell'
      if (needsApproval) {
        onEvent({ type: 'approval_request', toolCall })
      }

      const approved = await requestApproval(toolCall)

      if (!approved) {
        const result = {
          toolCallId: toolCall.id,
          toolName: toolCall.name,
          output: '[User rejected this action]'
        }
        onEvent({ type: 'tool_result', toolResult: result })
        history.push({
          role: 'tool',
          toolCallId: toolCall.id,
          toolName: toolCall.name,
          content: result.output
        })
        continue
      }

      // Execute
      const tool = tools[toolCall.name]
      const rawResult = await tool.execute(toolCall.args, workingDir)
      const result = { ...rawResult, toolCallId: toolCall.id, toolName: toolCall.name }

      onEvent({ type: 'tool_result', toolResult: result })
      history.push({
        role: 'tool',
        toolCallId: toolCall.id,
        toolName: toolCall.name,
        content: result.error ? `Error: ${result.error}` : result.output
      })
    }
    // Continue loop — model will respond to tool results
  }
}
