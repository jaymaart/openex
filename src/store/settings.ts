import { create } from 'zustand'
import type { Config } from '../../shared/types'

interface SettingsStore {
  config: Config | null
  isOpen: boolean
  setConfig: (config: Config) => void
  open: () => void
  close: () => void
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  config: null,
  isOpen: false,
  setConfig: (config) => set({ config }),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false })
}))
