import type { PetState } from '../types'
import { locales } from '../config/locales'

interface StatusPanelProps {
  visible: boolean
  state: PetState
  getExpNeeded: (level: number) => number
}

export function StatusPanel({ visible, state, getExpNeeded }: StatusPanelProps) {
  if (!visible) return null

  const expNeeded = getExpNeeded(state.level)
  const { statusLabels, petName } = locales

  return (
    <div className="status-panel">
      <div className="pet-name">{petName}</div>
      <div className="pet-level">Lv.{state.level} | {state.exp}/{expNeeded}</div>
      <div className="status-row">
        <span className="status-label">{statusLabels.energy}</span>
        <div className="status-bar-bg">
          <div className="status-bar-fill bar-energy" style={{ width: `${state.energy}%` }} />
        </div>
      </div>
      <div className="status-row">
        <span className="status-label">{statusLabels.hunger}</span>
        <div className="status-bar-bg">
          <div className="status-bar-fill bar-hunger" style={{ width: `${state.hunger}%` }} />
        </div>
      </div>
      <div className="status-row">
        <span className="status-label">{statusLabels.mood}</span>
        <div className="status-bar-bg">
          <div className="status-bar-fill bar-mood" style={{ width: `${state.mood}%` }} />
        </div>
      </div>
      <div className="status-row">
        <span className="status-label">{statusLabels.clean}</span>
        <div className="status-bar-bg">
          <div className="status-bar-fill bar-clean" style={{ width: `${state.clean}%` }} />
        </div>
      </div>
      <div className="status-row">
        <span className="status-label">{statusLabels.health}</span>
        <div className="status-bar-bg">
          <div className="status-bar-fill bar-health" style={{ width: `${state.health}%` }} />
        </div>
      </div>
      <div className="status-row">
        <span className="status-label">{statusLabels.exp}</span>
        <div className="status-bar-bg">
          <div className="status-bar-fill bar-exp" style={{ width: `${Math.min(100, (state.exp / expNeeded) * 100)}%` }} />
        </div>
      </div>
    </div>
  )
}
