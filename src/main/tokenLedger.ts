import { execFile } from 'child_process'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'

const SCAN_INTERVAL_MS = 30000
const TOKENS_PER_COIN = 10000

function getDataDir(): string {
  const dir = path.join(app.getPath('userData'), 'token-data')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

function getLedgerPath(): string {
  return path.join(getDataDir(), 'ledger.json')
}

interface LedgerData {
  lastExternalTotal: number
  lastScanTime: number
  appConsumed: number
  cumulativeExternal: number
}

function loadLedger(): LedgerData | null {
  try {
    const p = getLedgerPath()
    if (fs.existsSync(p)) {
      const data = JSON.parse(fs.readFileSync(p, 'utf-8'))
      if ('initialBalance' in data) {
        return createDefaultLedger()
      }
      return data
    }
  } catch {}
  return null
}

function saveLedger(ledger: LedgerData): void {
  fs.writeFileSync(getLedgerPath(), JSON.stringify(ledger, null, 2), 'utf-8')
}

function createDefaultLedger(): LedgerData {
  return {
    lastExternalTotal: 0,
    lastScanTime: 0,
    appConsumed: 0,
    cumulativeExternal: 0,
  }
}

function resolveTokscaleBin(): string {
  const binDir = path.join(app.getAppPath(), 'node_modules', '.bin')
  const cmd = process.platform === 'win32' ? 'tokscale.cmd' : 'tokscale'
  const full = path.join(binDir, cmd)
  if (fs.existsSync(full)) return full
  return cmd
}

interface TokscaleEntry {
  client?: string
  input?: number
  output?: number
  cacheRead?: number
  cacheWrite?: number
  reasoning?: number
  cost?: number
}

interface TokscaleReport {
  entries?: TokscaleEntry[]
}

function runTokscale(): Promise<TokscaleReport | null> {
  return new Promise((resolve) => {
    const bin = resolveTokscaleBin()
    const isCmd = bin.endsWith('.cmd') || bin.endsWith('.CMD')
    execFile(bin, ['--json', '--light'], {
      timeout: 20000,
      windowsHide: true,
      shell: isCmd,
    } as any, (err: any, stdout: string) => {
      if (err) { resolve(null); return }
      try { resolve(JSON.parse(stdout)) } catch { resolve(null) }
    })
  })
}

function extractTotalTokens(report: TokscaleReport | null): number {
  if (!report || !report.entries) return 0
  return report.entries.reduce((sum, e) => {
    return sum + (e.input || 0) + (e.output || 0) + (e.cacheRead || 0) + (e.cacheWrite || 0) + (e.reasoning || 0)
  }, 0)
}

function extractBreakdown(report: TokscaleReport | null): Record<string, { tokens: number; cost: number }> {
  if (!report || !report.entries) return {}
  const map: Record<string, { tokens: number; cost: number }> = {}
  for (const e of report.entries) {
    const key = e.client || 'unknown'
    const tokens = (e.input || 0) + (e.output || 0) + (e.cacheRead || 0) + (e.cacheWrite || 0) + (e.reasoning || 0)
    if (!map[key]) map[key] = { tokens: 0, cost: 0 }
    map[key].tokens += tokens
    map[key].cost += e.cost || 0
  }
  return map
}

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

export class TokenLedger {
  private ledger: LedgerData
  private scanTimer: ReturnType<typeof setInterval> | null
  private listeners: Set<(snapshot: TokenSnapshot) => void>
  private lastReport: TokscaleReport | null
  private scanning: boolean

  constructor() {
    this.ledger = loadLedger() || createDefaultLedger()
    this.scanTimer = null
    this.listeners = new Set()
    this.lastReport = null
    this.scanning = false
  }

  start(): void {
    this.scan()
    this.scanTimer = setInterval(() => this.scan(), SCAN_INTERVAL_MS)
  }

  stop(): void {
    if (this.scanTimer) { clearInterval(this.scanTimer); this.scanTimer = null }
  }

  onChange(fn: (snapshot: TokenSnapshot) => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private notify(): void {
    const snapshot = this.getSnapshot()
    for (const fn of this.listeners) {
      try { fn(snapshot) } catch {}
    }
  }

  async scan(): Promise<TokenSnapshot> {
    if (this.scanning) return this.getSnapshot()
    this.scanning = true
    try {
      const report = await runTokscale()
      if (report) {
        this.lastReport = report
        const currentTotal = extractTotalTokens(report)

        if (this.ledger.lastExternalTotal > 0) {
          const delta = Math.max(0, currentTotal - this.ledger.lastExternalTotal)
          this.ledger.cumulativeExternal += delta
        }

        this.ledger.lastExternalTotal = currentTotal
        this.ledger.lastScanTime = Date.now()
        saveLedger(this.ledger)
      }
    } finally {
      this.scanning = false
    }
    this.notify()
    return this.getSnapshot()
  }

  addAppConsumption(tokens: number): void {
    if (tokens <= 0) return
    this.ledger.appConsumed += tokens
    saveLedger(this.ledger)
    this.notify()
  }

  getSnapshot(): TokenSnapshot {
    const netTokens = Math.max(0, this.ledger.cumulativeExternal - this.ledger.appConsumed)
    return {
      externalTotal: this.ledger.lastExternalTotal,
      externalDelta: this.ledger.cumulativeExternal,
      appConsumed: this.ledger.appConsumed,
      totalConsumed: netTokens,
      coins: Math.floor(netTokens / TOKENS_PER_COIN),
      lastScanTime: this.ledger.lastScanTime,
      scanning: this.scanning,
      breakdown: extractBreakdown(this.lastReport),
      tokensPerCoin: TOKENS_PER_COIN,
    }
  }
}

export { TOKENS_PER_COIN }
