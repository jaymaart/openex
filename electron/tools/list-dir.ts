import { readdir, stat } from 'fs/promises'
import { resolve, join } from 'path'
import type { Tool } from './types'

export const listDirTool: Tool = {
  definition: {
    name: 'list_dir',
    description: 'List the contents of a directory.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory path, relative to working directory or absolute. Defaults to working directory.' }
      },
      required: []
    }
  },
  async execute({ path }, workingDir) {
    const fullPath = resolve(workingDir, path ?? '.')
    try {
      const entries = await readdir(fullPath)
      const lines = await Promise.all(
        entries.map(async (name) => {
          try {
            const s = await stat(join(fullPath, name))
            return s.isDirectory() ? `${name}/` : name
          } catch {
            return name
          }
        })
      )
      return { toolCallId: '', toolName: 'list_dir', output: lines.join('\n') }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      return { toolCallId: '', toolName: 'list_dir', output: '', error: message }
    }
  }
}
