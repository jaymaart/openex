import { readFile } from 'fs/promises'
import { resolve } from 'path'
import type { Tool } from './types'

export const readFileTool: Tool = {
  definition: {
    name: 'read_file',
    description: 'Read the contents of a file at the given path.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to the file, relative to the working directory or absolute.' }
      },
      required: ['path']
    }
  },
  async execute({ path }, workingDir) {
    const fullPath = resolve(workingDir, path ?? '')
    try {
      const content = await readFile(fullPath, 'utf-8')
      return { toolCallId: '', toolName: 'read_file', output: content }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      return { toolCallId: '', toolName: 'read_file', output: '', error: message }
    }
  }
}
