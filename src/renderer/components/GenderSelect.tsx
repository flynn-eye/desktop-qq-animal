import type { Gender } from '../types'

interface GenderSelectProps {
  onSelect: (gender: Gender) => void
}

export function GenderSelect({ onSelect }: GenderSelectProps) {
  return (
    <div className="gender-select">
      <div className="gender-title">选择你的宠物</div>
      <div className="gender-options">
        <button className="gender-btn" onClick={() => onSelect('GG')}>
          <img src="./assets/Action/GG/Egg/Stand.swf" alt="GG" className="gender-preview" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <span className="gender-label">GG</span>
        </button>
        <button className="gender-btn" onClick={() => onSelect('MM')}>
          <img src="./assets/Action/MM/Egg/Stand.swf" alt="MM" className="gender-preview" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <span className="gender-label">MM</span>
        </button>
      </div>
    </div>
  )
}
