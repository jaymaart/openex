import React, { useEffect, useState } from 'react'
import { api } from './lib/api'
import { useSettingsStore } from './store/settings'
import { TopBar } from './components/Chat/TopBar'
import { MessageThread } from './components/Chat/MessageThread'
import { MessageInput } from './components/Chat/MessageInput'
import { SettingsPanel } from './components/Settings/SettingsPanel'
import type { Config } from '../../shared/types'

export function App() {
  const { isOpen, open, close, setConfig } = useSettingsStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.hasConfig(), api.getConfig()]).then(([has, config]) => {
      setConfig(config)
      setLoading(false)
      if (!has) open()
    })
  }, [])

  if (loading) {
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
