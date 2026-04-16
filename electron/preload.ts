import { contextBridge, ipcRenderer } from 'electron'
import type { Config, AgentEvent } from '../shared/types'

contextBridge.exposeInMainWorld('electronAPI', {
  // Config
  getConfig: (): Promise<Config> => ipcRenderer.invoke('config:get'),
  setConfig: (config: Config): Promise<{ ok: boolean }> => ipcRenderer.invoke('config:set', config),
  hasConfig: (): Promise<boolean> => ipcRenderer.invoke('config:has'),

  // Agent
  sendMessage: (message: string): void => ipcRenderer.send('agent:send', message),
  respondToApproval: (toolCallId: string, approved: boolean): void =>
    ipcRenderer.send('agent:approval', { toolCallId, approved }),

  onAgentEvent: (cb: (event: AgentEvent) => void): (() => void) => {
    const listener = (_: Electron.IpcRendererEvent, event: AgentEvent) => cb(event)
    ipcRenderer.on('agent:event', listener)
    return () => ipcRenderer.removeListener('agent:event', listener)
  }
})
