import type { Tool } from './types'
import { readFileTool } from './read-file'
import { listDirTool } from './list-dir'
import { writeFileTool } from './write-file'
import { shellTool } from './shell'

export const tools: Record<string, Tool> = {
  read_file: readFileTool,
  list_dir: listDirTool,
  write_file: writeFileTool,
  shell: shellTool
}

export { Tool }
