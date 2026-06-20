export interface TokenSnapshot {
  externalTotal: number
  externalDelta: number
  appConsumed: number
  totalConsumed: number
  coins: number
  lastScanTime: number
  scanning: boolean
  breakdown: Record<string, { tokens: number; cost: number }>
  tokensPerCoin: number
}

export interface AIToolCall {
  id: string
  name: string
  args: Record<string, unknown>
  cost: number
}

export interface AIChatResult {
  text: string
  tools: AIToolCall[]
}

export interface DesktopPetAPI {
  getScreenSize(): Promise<{ width: number; height: number }>
  setWindowPosition(x: number, y: number): Promise<void>
  getWindowPosition(): Promise<[number, number]>
  setWindowSize(w: number, h: number): Promise<void>
  setIgnoreMouseEvents(ignore: boolean, options?: { forward: boolean }): Promise<void>
  setAlwaysOnTop(flag: boolean): Promise<void>
  toggleVisibility(): Promise<boolean>
  showContextMenu(items: Array<{ id?: string; label?: string; type?: 'separator' }>): void
  onContextMenuClick(callback: (id: string) => void): void
  startDrag(): Promise<any>
  stopDrag(): Promise<void>
  quit(): void
  platform: string

  tokenGetSnapshot(): Promise<TokenSnapshot>
  tokenForceRefresh(): Promise<TokenSnapshot>
  tokenAddConsumption(tokens: number): Promise<TokenSnapshot>
  onTokenUpdated(callback: (snapshot: TokenSnapshot) => void): void

  aiChat(data: { message: string; petState: any }): Promise<AIChatResult>
  aiClearHistory(): Promise<void>
  onToolExecute(callback: (tool: AIToolCall) => void): void
}

declare global {
  interface Window {
    desktopPet: DesktopPetAPI
  }
}
