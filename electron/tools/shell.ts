import { spawn } from 'child_process'
import type { Tool } from './types'

export const shellTool: Tool = {
  definition: {
    name: 'shell',
    description: 'Run a shell command in the working directory.',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'The shell command to run.' }
      },
      required: ['command']
    }
  },
  async execute({ command }, workingDir) {
    return new Promise((resolve) => {
      const isWin = process.platform === 'win32'
      const shell = isWin ? 'cmd' : '/bin/sh'
      const shellArgs = isWin ? ['/c', command ?? ''] : ['-c', command ?? '']

      const child = spawn(shell, shellArgs, {
        cwd: workingDir,
        env: process.env
      })

      let stdout = ''
      let stderr = ''

      child.stdout.on('data', (d) => { stdout += d.toString() })
      child.stderr.on('data', (d) => { stderr += d.toString() })

      child.on('close', (code) => {
        const output = [stdout, stderr].filter(Boolean).join('\n')
        resolve({
          toolCallId: '',
          toolName: 'shell',
          output: output || '(no output)',
          exitCode: code ?? 0,
          error: code !== 0 ? `Exited with code ${code}` : undefined
        })
      })

      child.on('error', (err) => {
        resolve({ toolCallId: '', toolName: 'shell', output: '', error: err.message, exitCode: 1 })
      })
    })
  }
}
