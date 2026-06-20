import type { TokenSnapshot } from '../hooks/useTokenLedger'

interface TokenPanelProps {
  visible: boolean
  snapshot: TokenSnapshot
  loading: boolean
  onRefresh: () => void
}

function formatNum(n: number): string {
  if (n >= 10000000) return (n / 10000000).toFixed(1) + '千万'
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  return n.toLocaleString()
}

function formatTime(ts: number): string {
  if (!ts) return '从未'
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function TokenPanel({ visible, snapshot, loading, onRefresh }: TokenPanelProps) {
  if (!visible) return null

  const clients = Object.entries(snapshot.breakdown)

  return (
    <div className="token-panel">
      <div className="token-header">
        <span className="token-title">Token 消耗</span>
        <button
          className={`token-refresh-btn ${loading || snapshot.scanning ? 'spinning' : ''}`}
          onClick={onRefresh}
          disabled={loading || snapshot.scanning}
          title="手动刷新"
        >
          ↻
        </button>
      </div>

      <div className="token-balance-row">
        <span className="token-balance-value">{formatNum(snapshot.totalConsumed)}</span>
        <span className="token-balance-unit">已消耗</span>
      </div>
      <div className="token-coins-row">
        <span className="token-coins-icon">🪙</span>
        <span className="token-coins-value">{snapshot.coins}</span>
        <span className="token-balance-unit">可兑换</span>
      </div>

      <div className="token-divider" />

      <div className="token-detail-row">
        <span className="token-detail-label">外部工具</span>
        <span className="token-detail-value">{formatNum(snapshot.externalDelta)}</span>
      </div>
      <div className="token-detail-row">
        <span className="token-detail-label">应用内</span>
        <span className="token-detail-value">{formatNum(snapshot.appConsumed)}</span>
      </div>

      {clients.length > 0 && (
        <>
          <div className="token-divider" />
          <div className="token-breakdown-title">消耗来源</div>
          {clients.map(([client, data]) => (
            <div key={client} className="token-detail-row">
              <span className="token-detail-label">{client}</span>
              <span className="token-detail-value">{formatNum(data.tokens)}</span>
            </div>
          ))}
        </>
      )}

      <div className="token-divider" />
      <div className="token-scan-info">
        上次扫描: {formatTime(snapshot.lastScanTime)}
        {snapshot.scanning && <span className="token-scanning"> 扫描中...</span>}
      </div>
    </div>
  )
}
