import type { Gender } from '../types'
import { SwfPreview } from './SwfPreview'

interface GenderSelectProps {
  onSelect: (gender: Gender) => void
}

export function GenderSelect({ onSelect }: GenderSelectProps) {
  return (
    <div className="gender-select">
      <div className="gender-title">选择你的宠物</div>
      <div className="gender-options">
        <button className="gender-btn" onClick={() => onSelect('GG')}>
          <SwfPreview src="./assets/Action/GG/Egg/Stand.swf" width={80} height={80} />
          <span className="gender-label">GG</span>
        </button>
        <button className="gender-btn" onClick={() => onSelect('MM')}>
          <SwfPreview src="./assets/Action/MM/Egg/Stand.swf" width={80} height={80} />
          <span className="gender-label">MM</span>
        </button>
      </div>
    </div>
  )
}
