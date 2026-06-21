import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('desktopPet', {
  getScreenSize: () => ipcRenderer.invoke('get-screen-size'),
  setWindowPosition: (x: number, y: number) => ipcRenderer.invoke('set-window-position', x, y),
  getWindowPosition: () => ipcRenderer.invoke('get-window-position'),
  setWindowSize: (w: number, h: number) => ipcRenderer.invoke('set-window-size', w, h),
  setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }) => ipcRenderer.invoke('set-ignore-mouse-events', ignore, options),
  setAlwaysOnTop: (flag: boolean) => ipcRenderer.invoke('set-always-on-top', flag),
  toggleVisibility: () => ipcRenderer.invoke('toggle-visibility'),
  showWindow: () => ipcRenderer.invoke('show-window'),
  showContextMenu: (items: Array<{ id?: string; label?: string; type?: 'separator' }>) => ipcRenderer.send('show-context-menu', items),
  onContextMenuClick: (callback: (id: string) => void) => {
    ipcRenderer.removeAllListeners('context-menu-click')
    ipcRenderer.on('context-menu-click', (_: any, id: string) => callback(id))
  },
  startDrag: () => ipcRenderer.invoke('start-drag'),
  stopDrag: () => ipcRenderer.invoke('stop-drag'),
  quit: () => ipcRenderer.send('quit-app'),
  platform: process.platform,

  // Token Ledger
  tokenGetSnapshot: () => ipcRenderer.invoke('token-get-snapshot'),
  tokenForceRefresh: () => ipcRenderer.invoke('token-force-refresh'),
  tokenAddConsumption: (tokens: number) => ipcRenderer.invoke('token-add-consumption', tokens),
  onTokenUpdated: (callback: (snapshot: any) => void) => {
    ipcRenderer.removeAllListeners('token-updated')
    ipcRenderer.on('token-updated', (_: any, snapshot: any) => callback(snapshot))
  },

  // AI Chat
  aiChat: (data: { message: string; petState: any }) => ipcRenderer.invoke('ai-chat', data),
  aiClearHistory: () => ipcRenderer.invoke('ai-clear-history'),
  onToolExecute: (callback: (tool: any) => void) => {
    ipcRenderer.removeAllListeners('tool-execute')
    ipcRenderer.on('tool-execute', (_: any, tool: any) => callback(tool))
  },

  // Agent Events
  onAgentEvent: (callback: (data: any) => void) => {
    ipcRenderer.removeAllListeners('agent-event')
    ipcRenderer.on('agent-event', (_: any, data: any) => callback(data))
  },

  // Plugin Installer
  installPlugins: () => ipcRenderer.invoke('install-plugins'),
})
