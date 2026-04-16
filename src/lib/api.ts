import type { Config, AgentEvent } from '../../shared/types'

interface ElectronAPI {
  getConfig(): Promise<Config>
  setConfig(config: Config): Promise<{ ok: boolean }>
  hasConfig(): Promise<boolean>
  sendMessage(message: string): void
  respondToApproval(toolCallId: string, approved: boolean): void
  onAgentEvent(cb: (event: AgentEvent) => void): () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export const api: ElectronAPI = window.electronAPI
