import type { ToolCallArgs, ToolResult } from '../../shared/types'
import type { ToolDefinition } from '../providers/types'

export interface Tool {
  definition: ToolDefinition
  execute(args: ToolCallArgs, workingDir: string): Promise<ToolResult>
}
