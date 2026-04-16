import React, { useEffect } from 'react'
import { trpc } from './lib/trpc'
import { useSettingsStore } from './store/settings'
import { TopBar } from './components/Chat/TopBar'
import { MessageThread } from './components/Chat/MessageThread'
import { MessageInput } from './components/Chat/MessageInput'
import { SettingsPanel } from './components/Settings/SettingsPanel'

export function App() {
  const { isOpen, open, close, setConfig } = useSettingsStore()
  const { data: hasConfig, isLoading } = trpc.config.hasConfig.useQuery()
  const { data: config } = trpc.config.get.useQuery()

  // Sync loaded config into store
  useEffect(() => {
    if (config) setConfig(config)
  }, [config])

  // First-run: open settings automatically if no config exists
  useEffect(() => {
    if (!isLoading && hasConfig === false) {
      open()
    }
  }, [isLoading, hasConfig])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-zinc-600 text-sm">
        Loading…
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar />
      <MessageThread />
      <MessageInput />
      {isOpen && <SettingsPanel onClose={close} />}
    </div>
  )
}
