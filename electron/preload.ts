import { contextBridge, ipcRenderer } from 'electron'
import type { Config, AgentEvent } from '../shared/types'

// Single persistent listener — swappable callback avoids contextBridge function-return limitation
let agentCallback: ((event: AgentEvent) => void) | null = null

ipcRenderer.on('agent:event', (_event, data: AgentEvent) => {
  agentCallback?.(data)
})

contextBridge.exposeInMainWorld('electronAPI', {
  // Config
  getConfig: (): Promise<Config> =>
    ipcRenderer.invoke('config:get'),
  setConfig: (config: Config): Promise<{ ok: boolean }> =>
    ipcRenderer.invoke('config:set', config),
  hasConfig: (): Promise<boolean> =>
    ipcRenderer.invoke('config:has'),

  // Agent — send a message to start the loop
  sendMessage: (message: string): void =>
    ipcRenderer.send('agent:send', message),

  // Register/clear the single active event handler
  onAgentEvent: (cb: (event: AgentEvent) => void): void => {
    agentCallback = cb
  },
  offAgentEvent: (): void => {
    agentCallback = null
  },

  // Respond to an approval request
  respondToApproval: (toolCallId: string, approved: boolean): void =>
    ipcRenderer.send('agent:approval', { toolCallId, approved })
})
