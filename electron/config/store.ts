import Store from 'electron-store'
import { safeStorage } from 'electron'
import type { Config } from '../../shared/types'
import os from 'os'

const ENCRYPTED_KEY = 'encryptedConfig'

const store = new Store({ name: 'openex-config' })

export const defaultConfig: Config = {
  activeProvider: 'openai-compat',
  providers: {
    'openai-compat': {
      baseUrl: 'http://localhost:11434/v1',
      apiKey: '',
      model: 'llama3'
    },
    anthropic: {
      apiKey: '',
      model: 'claude-opus-4-6'
    }
  },
  approval: 'smart',
  workingDir: os.homedir()
}

export function hasConfig(): boolean {
  return store.has(ENCRYPTED_KEY)
}

export function getConfig(): Config {
  const raw = store.get(ENCRYPTED_KEY) as string | undefined
  if (!raw) return { ...defaultConfig }
  try {
    const decrypted = safeStorage.decryptString(Buffer.from(raw, 'base64'))
    return { ...defaultConfig, ...JSON.parse(decrypted) }
  } catch {
    return { ...defaultConfig }
  }
}

export function setConfig(config: Config): void {
  const json = JSON.stringify(config)
  const encrypted = safeStorage.encryptString(json).toString('base64')
  store.set(ENCRYPTED_KEY, encrypted)
}
