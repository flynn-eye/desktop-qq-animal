import fs from 'fs'
import path from 'path'
import { app, BrowserWindow } from 'electron'

const POLL_INTERVAL = 200

export interface AgentEvent {
  event: 'session_start' | 'session_end' | 'tool_start' | 'tool_end' | 'thinking' | 'idle' | 'error' | 'speak'
  agent: 'opencode' | 'claude-code' | 'codex'
  tool?: string
  status?: 'running' | 'completed' | 'failed'
  message?: string
}

export function getEventDir(): string {
  return path.join(app.getPath('home'), '.qq-pet')
}

export function getEventFile(): string {
  return path.join(getEventDir(), 'events.jsonl')
}

export class EventPoller {
  private timer: ReturnType<typeof setInterval> | null = null
  private win: BrowserWindow | null = null
  private lastSize = 0
  private eventFile: string

  constructor() {
    this.eventFile = getEventFile()
  }

  start(win: BrowserWindow): void {
    this.win = win
    const dir = getEventDir()
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    if (!fs.existsSync(this.eventFile)) fs.writeFileSync(this.eventFile, '')
    this.lastSize = fs.statSync(this.eventFile).size
    this.timer = setInterval(() => this.poll(), POLL_INTERVAL)
    console.log('[EventPoller] started, watching:', this.eventFile)
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  private poll(): void {
    try {
      const stat = fs.statSync(this.eventFile)
      if (stat.size <= this.lastSize) return

      const fd = fs.openSync(this.eventFile, 'r')
      const buf = Buffer.alloc(stat.size - this.lastSize)
      fs.readSync(fd, buf, 0, buf.length, this.lastSize)
      fs.closeSync(fd)

      // 处理完后截断文件
      this.lastSize = 0
      fs.writeFileSync(this.eventFile, '')

      const lines = buf.toString('utf-8').split('\n').filter(l => l.trim())
      for (const line of lines) {
        try {
          const event: AgentEvent = JSON.parse(line)
          this.handleEvent(event)
        } catch {}
      }
    } catch {}
  }

  private handleEvent(event: AgentEvent): void {
    if (!this.win || this.win.isDestroyed()) return
    console.log('[EventPoller] event:', event.event, event.agent, event.tool || '')
    this.win.webContents.send('agent-event', event)
  }
}
