import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { getConfig, setConfig, hasConfig } from './config/store'
import { runAgentLoop } from './agent/loop'
import { resolveApproval } from './agent/approval'
import type { Config } from '../shared/types'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    backgroundColor: '#0d0d0d',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

ipcMain.handle('config:get', () => getConfig())

ipcMain.handle('config:set', (_event, config: Config) => {
  setConfig(config)
  return { ok: true }
})

ipcMain.handle('config:has', () => hasConfig())

ipcMain.on('agent:send', (event, message: string) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return

  runAgentLoop(message, (agentEvent) => {
    win.webContents.send('agent:event', agentEvent)
  }).catch((err) => {
    win.webContents.send('agent:event', {
      type: 'error',
      error: err?.message ?? String(err)
    })
  })
})

ipcMain.on('agent:approval', (_event, { toolCallId, approved }: { toolCallId: string; approved: boolean }) => {
  resolveApproval(toolCallId, approved)
})

// ─── App lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
