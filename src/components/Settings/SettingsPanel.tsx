import React, { useEffect, useState } from 'react'
import { trpc } from '../../lib/trpc'
import { useSettingsStore } from '../../store/settings'
import type { Config } from '../../../../shared/types'

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { config, setConfig } = useSettingsStore()
  const setConfigMutation = trpc.config.set.useMutation()
  const { data: loadedConfig } = trpc.config.get.useQuery()

  const [form, setForm] = useState<Config | null>(null)

  useEffect(() => {
    const c = config ?? loadedConfig
    if (c) setForm(c)
  }, [config, loadedConfig])

  if (!form) return null

  const handleSave = async () => {
    await setConfigMutation.mutateAsync(form)
    setConfig(form)
    onClose()
  }

  const provider = form.activeProvider
  const isOpenAI = provider === 'openai-compat'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#1a1a1a] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors text-xl leading-none">×</button>
        </div>

        {/* Provider */}
        <label className="block mb-4">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Provider</span>
          <select
            value={form.activeProvider}
            onChange={(e) => setForm({ ...form, activeProvider: e.target.value as Config['activeProvider'] })}
            className="mt-1 w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white border border-white/10 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="openai-compat">OpenAI-compatible (Ollama, OpenRouter, Groq…)</option>
            <option value="anthropic">Anthropic (Claude)</option>
          </select>
        </label>

        {/* API Key */}
        <label className="block mb-4">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">API Key</span>
          <input
            type="password"
            placeholder={isOpenAI ? 'sk-... (leave blank for Ollama)' : 'sk-ant-...'}
            value={isOpenAI ? form.providers['openai-compat'].apiKey : form.providers.anthropic.apiKey}
            onChange={(e) => {
              if (isOpenAI) {
                setForm({ ...form, providers: { ...form.providers, 'openai-compat': { ...form.providers['openai-compat'], apiKey: e.target.value } } })
              } else {
                setForm({ ...form, providers: { ...form.providers, anthropic: { ...form.providers.anthropic, apiKey: e.target.value } } })
              }
            }}
            className="mt-1 w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white border border-white/10 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          />
        </label>

        {/* Base URL — openai-compat only */}
        {isOpenAI && (
          <label className="block mb-4">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Base URL</span>
            <input
              type="text"
              value={form.providers['openai-compat'].baseUrl}
              onChange={(e) =>
                setForm({ ...form, providers: { ...form.providers, 'openai-compat': { ...form.providers['openai-compat'], baseUrl: e.target.value } } })
              }
              className="mt-1 w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white border border-white/10 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </label>
        )}

        {/* Model */}
        <label className="block mb-4">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Model</span>
          <input
            type="text"
            value={isOpenAI ? form.providers['openai-compat'].model : form.providers.anthropic.model}
            onChange={(e) => {
              if (isOpenAI) {
                setForm({ ...form, providers: { ...form.providers, 'openai-compat': { ...form.providers['openai-compat'], model: e.target.value } } })
              } else {
                setForm({ ...form, providers: { ...form.providers, anthropic: { ...form.providers.anthropic, model: e.target.value } } })
              }
            }}
            className="mt-1 w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white border border-white/10 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          />
        </label>

        {/* Approval mode */}
        <label className="block mb-6">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Approval Mode</span>
          <select
            value={form.approval}
            onChange={(e) => setForm({ ...form, approval: e.target.value as Config['approval'] })}
            className="mt-1 w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white border border-white/10 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="smart">Smart — ask before file writes &amp; shell commands</option>
            <option value="manual">Manual — ask before everything</option>
            <option value="auto">Auto — approve all actions</option>
          </select>
        </label>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={setConfigMutation.isLoading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {setConfigMutation.isLoading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
