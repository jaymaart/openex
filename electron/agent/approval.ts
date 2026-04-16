import type { ApprovalMode, ToolCall } from '../../shared/types'
import { getConfig } from '../config/store'

// Pending approval promises: toolCallId → resolver
const pending = new Map<string, (approved: boolean) => void>()

/** Called by the agent loop — returns true if the tool call should proceed. */
export async function requestApproval(toolCall: ToolCall): Promise<boolean> {
  const { approval } = getConfig()
  if (approval === 'auto') return true
  if (approval === 'manual') return awaitUserDecision(toolCall.id)

  // smart: auto-approve reads, ask for writes/shell
  const safe = toolCall.name === 'read_file' || toolCall.name === 'list_dir'
  if (safe) return true
  return awaitUserDecision(toolCall.id)
}

function awaitUserDecision(toolCallId: string): Promise<boolean> {
  return new Promise((resolve) => {
    pending.set(toolCallId, resolve)
  })
}

/** Called by the tRPC respondToApproval mutation. */
export function resolveApproval(toolCallId: string, approved: boolean): void {
  const resolve = pending.get(toolCallId)
  if (resolve) {
    pending.delete(toolCallId)
    resolve(approved)
  }
}
