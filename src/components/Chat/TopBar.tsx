import React from 'react'
import { api } from '../../lib/api'
import { useSettingsStore } from '../../store/settings'

export function TopBar() {
  const { config, setConfig, open } = useSettingsStore()

  const handlePickFolder = async () => {
    const dir = prompt('Enter working directory path:', config?.workingDir ?? '')
    if (dir && config) {
      const updated = { ...config, workingDir: dir }
      await api.setConfig(updated)
      setConfig(updated)
    }
  }

  const modelName = config
    ? config.activeProvider === 'anthropic'
      ? config.providers.anthropic.model
      : config.providers['openai-compat'].model
    : ''

  return (
    <div className="flex h-12 items-center justify-between border-b border-white/10 bg-[#111] px-4 flex-shrink-0">
      <button
        onClick={handlePickFolder}
        className="flex items-center gap-2 rounded-md px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors max-w-xs"
        title={config?.workingDir ?? 'No folder selected'}
      >
        <FolderIcon />
        <span className="truncate max-w-[200px]">{config?.workingDir ?? 'Pick a folder…'}</span>
      </button>

      <div className="flex items-center gap-2">
        {modelName && <span className="text-xs text-zinc-600">{modelName}</span>}
        <button
          onClick={open}
          className="rounded-md p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          title="Settings"
        >
          <GearIcon />
        </button>
      </div>
    </div>
  )
}

function FolderIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}
