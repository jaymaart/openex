import { readFile, writeFile, mkdir } from 'fs/promises'
import { resolve, dirname } from 'path'
import type { Tool } from './types'

export const writeFileTool: Tool = {
  definition: {
    name: 'write_file',
    description: 'Write content to a file, creating it or overwriting if it exists.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to the file, relative to working directory or absolute.' },
        content: { type: 'string', description: 'The content to write.' }
      },
      required: ['path', 'content']
    }
  },
  async execute({ path, content }, workingDir) {
    const fullPath = resolve(workingDir, path ?? '')
    let originalContent: string | undefined
    try {
      originalContent = await readFile(fullPath, 'utf-8')
    } catch {
      // File doesn't exist — that's fine
    }
    try {
      await mkdir(dirname(fullPath), { recursive: true })
      await writeFile(fullPath, content ?? '', 'utf-8')
      return {
        toolCallId: '',
        toolName: 'write_file',
        output: `Written ${fullPath}`,
        originalContent
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      return { toolCallId: '', toolName: 'write_file', output: '', error: message }
    }
  }
}
