import { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import started from 'electron-squirrel-startup'
import { TokenLedger } from './main/tokenLedger'
import { PetAI } from './main/ai'

// 允许 file:// 协议下的本地文件访问（Ruffle wasm 加载需要）
app.commandLine.appendSwitch('allow-file-access-from-files')

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit()
}

let win: BrowserWindow | null = null
let tray: Tray | null = null
const tokenLedger = new TokenLedger()
const petAI = new PetAI()

function createWindow(): void {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

  win = new BrowserWindow({
    width: 300,
    height: 700,
    x: screenWidth - 350,
    y: screenHeight - 720,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    }
  })

  win.setIgnoreMouseEvents(false)

  // 窗口失焦时自动停止拖拽
  win.on('blur', () => stopDrag())

  // 加载策略：Forge 模式 或 手动 dev 模式
  if (typeof MAIN_WINDOW_VITE_DEV_SERVER_URL !== 'undefined' && MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else if (typeof MAIN_WINDOW_VITE_NAME !== 'undefined') {
    win.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    )
  } else {
    // 手动 dev 模式：连 Vite dev server
    win.loadURL('http://localhost:5173')
  }

  if (!app.isPackaged) {
    win.webContents.openDevTools({ mode: 'detach' })
  }

  createTray()
}

// 托盘菜单文案（与 src/renderer/config/locales.ts 中的 tray 保持同步）
const TRAY_STRINGS = {
  tooltip: '桌面宠物',
  show: '显示宠物',
  hide: '隐藏宠物',
  exit: '退出',
}

function createTray(): void {
  const iconPath = path.join(app.getAppPath(), 'public', 'tray-icon.png')
  let icon
  if (fs.existsSync(iconPath)) {
    icon = nativeImage.createFromPath(iconPath)
  } else {
    icon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABbSURBVDiNY/z//z8DMwMDAwMTE5DBQAMABQYG4gYwMDAwMDIy/mcAAyYGBoZ/DAz/Gf4z/GP4x/CP4R/DP4Z/DP8Y/jH8Y/jH8I/hH8M/hn8M/xj+Mfxj+MfwDwA2VBkRuVT+ZQAAAABJRU5ErkJggg==')
  }

  tray = new Tray(icon)
  tray.setToolTip(TRAY_STRINGS.tooltip)
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: TRAY_STRINGS.show, click: () => win && win.show() },
    { label: TRAY_STRINGS.hide, click: () => win && win.hide() },
    { type: 'separator' },
    { label: TRAY_STRINGS.exit, click: () => app.quit() }
  ]))
}

// IPC handlers
ipcMain.handle('get-screen-size', () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  return { width, height }
})

ipcMain.handle('set-window-position', (_, x: number, y: number) => {
  if (win) win.setPosition(Math.round(x), Math.round(y))
})

ipcMain.handle('get-window-position', () => {
  return win ? win.getPosition() : [0, 0]
})

ipcMain.handle('set-window-size', (_, width: number, height: number) => {
  if (win) win.setSize(Math.round(width), Math.round(height))
})

ipcMain.handle('set-ignore-mouse-events', (_, ignore: boolean, options: { forward: boolean }) => {
  if (win) win.setIgnoreMouseEvents(ignore, options)
})

ipcMain.handle('set-always-on-top', (_, flag: boolean) => {
  if (win) win.setAlwaysOnTop(flag)
})

ipcMain.handle('toggle-visibility', () => {
  if (!win) return false
  if (win.isVisible()) win.hide()
  else win.show()
  return win.isVisible()
})

// 拖拽状态
let dragState: { startX: number; startY: number; winX: number; winY: number } | null = null
let dragInterval: ReturnType<typeof setInterval> | null = null

ipcMain.handle('start-drag', () => {
  if (!win) return null
  const cursorPos = screen.getCursorScreenPoint()
  const winPos = win.getPosition()
  dragState = {
    startX: cursorPos.x,
    startY: cursorPos.y,
    winX: winPos[0],
    winY: winPos[1],
  }
  // 用轮询方式跟踪鼠标，避免透明窗口事件丢失
  if (dragInterval) clearInterval(dragInterval)
  dragInterval = setInterval(() => {
    if (!win || !dragState) return
    const pos = screen.getCursorScreenPoint()
    win.setPosition(
      Math.round(dragState.winX + pos.x - dragState.startX),
      Math.round(dragState.winY + pos.y - dragState.startY)
    )
  }, 16)
  return dragState
})

ipcMain.handle('stop-drag', () => {
  dragState = null
  if (dragInterval) {
    clearInterval(dragInterval)
    dragInterval = null
  }
})

// 窗口失焦时自动停止拖拽
function stopDrag(): void {
  dragState = null
  if (dragInterval) {
    clearInterval(dragInterval)
    dragInterval = null
  }
}

ipcMain.on('quit-app', () => app.quit())

// Token Ledger IPC
ipcMain.handle('token-get-snapshot', () => {
  return tokenLedger.getSnapshot()
})

ipcMain.handle('token-force-refresh', async () => {
  return await tokenLedger.scan()
})

ipcMain.handle('token-add-consumption', (_, tokens: number) => {
  tokenLedger.addAppConsumption(tokens)
  return tokenLedger.getSnapshot()
})

tokenLedger.onChange((snapshot) => {
  if (win && !win.isDestroyed()) {
    win.webContents.send('token-updated', snapshot)
  }
})

// AI Chat IPC
ipcMain.handle('ai-chat', async (_, { message, petState }: { message: string; petState: any }) => {
  const balance = tokenLedger.getSnapshot().coins
  const result = await petAI.chat(message, petState, balance)
  if (result.tools && result.tools.length > 0) {
    const totalCost = result.tools.reduce((s: number, t: any) => s + t.cost, 0)
    if (totalCost > 0) tokenLedger.addAppConsumption(totalCost)
  }
  return result
})

ipcMain.handle('ai-clear-history', () => {
  petAI.clearHistory()
})

ipcMain.on('show-context-menu', (_, menuItems: Array<{ id?: string; label?: string; type?: 'separator' }>) => {
  const template = menuItems.map(item => {
    if (item.type === 'separator') return { type: 'separator' as const }
    return {
      label: item.label,
      click: () => win && win.webContents.send('context-menu-click', item.id)
    }
  })
  Menu.buildFromTemplate(template).popup({ window: win! })
})

app.whenReady().then(() => {
  createWindow()
  tokenLedger.start()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
