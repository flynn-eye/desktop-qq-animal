import type { AnimKey, Gender, Stage, AdultMood } from '../types'
import { SWF_PATHS } from './swf-paths'

const pathMap: Record<string, string> = SWF_PATHS

// 查找路径
function findPath(gender: Gender, stage: Stage, key: string): string | null {
  return pathMap[`${gender}_${stage}_${key}`] || null
}

// 随机选一个匹配前缀的路径
function findRandomByPrefix(gender: Gender, stage: Stage, prefix: string): string | null {
  const matches: string[] = []
  for (const [k, v] of Object.entries(pathMap)) {
    if (k.startsWith(`${gender}_${stage}_${prefix}`)) {
      matches.push(v)
    }
  }
  if (matches.length === 0) return null
  return matches[Math.floor(Math.random() * matches.length)]
}

// ===== 公开 API =====

export function getAnimFile(key: AnimKey, gender: Gender, stage: Stage, adultMood: AdultMood): string | null {
  if (stage === 'Egg') {
    return getEggAnim(key, gender)
  }
  if (stage === 'Kid') {
    return getKidAnim(key, gender)
  }
  return getAdultAnim(key, gender, adultMood)
}

function getEggAnim(key: AnimKey, gender: Gender): string | null {
  const map: Record<string, string> = {
    first: 'First', appear: 'Appear', hide: 'Hide',
    stand: 'Stand', speak: 'Speak1',
    eat: 'Eat1', clean: 'Clean', cure: 'Cure', sick: 'Sick',
    dying: 'Dying', die: 'Die', bury: 'Bury', revival: 'Revival', levUp: 'LevUp',
    hideLeft1: 'Hide_left1', hideLeft2: 'Hide_left2',
    hideRight1: 'Hide_right1', hideRight2: 'Hide_right2',
    enter1: 'Enter1', enter2: 'Enter2',
    exit1: 'Exit1', exit2: 'Exit2', exit3: 'Exit3',
    interactH1: 'interact_H1', interactH2: 'interact_H2', interactH3: 'interact_H3',
    interactM1: 'interact_M1', interactM2: 'interact_M2',
    interactFall: 'interact_Fall', interactS1: 'interact_S1',
    interactE1: 'interact_E1', interactE2: 'interact_E2', interactE3: 'interact_E3',
    interactF1: 'interact_F1', interactF2: 'interact_F2',
    interactF3: 'interact_F3', interactF4: 'interact_F4', interactF5: 'interact_F5',
  }
  const assetKey = map[key]
  if (assetKey) {
    const p = findPath(gender, 'Egg', assetKey)
    if (p) return p
  }
  return null
}

function getKidAnim(key: AnimKey, gender: Gender): string | null {
  const map: Record<string, string> = {
    first: 'First', appear: 'Appear', hide: 'Hide',
    stand: 'Stand', speak: 'Speak',
    eat: 'Eat1', clean: 'Clean', dirty: 'Dirty', cure: 'Cure', sick: 'Sick', hungry: 'Hungry',
    dying: 'Dying', die: 'Die', bury: 'Bury', revival: 'Revival', levUp: 'LevUp',
    hideLeft1: 'Hide_left1', hideLeft2: 'Hide_left2',
    hideRight1: 'Hide_right1', hideRight2: 'Hide_right2',
    enter1: 'Enter1', enter2: 'Enter2', enter3: 'Enter3',
    exit1: 'Exit1', exit2: 'Exit2', exit3: 'Exit3',
    interactH1: 'Interact_H1', interactH2: 'Interact_H2', interactH3: 'Interact_H3',
    interactM1: 'Interact_M1', interactM2: 'Interact_M2',
    interactFall: 'Interact_Fall', interactS1: 'Interact_S1', interactS2: 'Interact_S2',
  }
  const assetKey = map[key]
  if (assetKey) {
    const p = findPath(gender, 'Kid', assetKey)
    if (p) return p
  }
  return null
}

function getAdultAnim(key: AnimKey, gender: Gender, mood: AdultMood): string | null {
  // 根动画（不依赖 mood）
  const rootMap: Record<string, string> = {
    first: 'First', appear: 'Appear', hide: 'Hide',
    eat: 'Eat1', clean: 'Clean1', cure: 'Cure1', sick: 'Sick1',
    dying: 'Dying', die: 'Die', bury: 'Bury', revival: 'Revival', levUp: 'LevUp',
    hideLeft1: 'Hide_left', hideRight1: 'Hide_right',
    enter1: 'Enter1', enter2: 'Enter2', enter3: 'Enter3',
    exit1: 'Exit1', exit2: 'Exit2', exit3: 'Exit3', exit4: 'Exit4',
  }
  const rootKey = rootMap[key]
  if (rootKey) {
    const p = findPath(gender, 'Adult', rootKey)
    if (p) return p
  }

  // mood 专属动画: Stand, Speak, Appear, Hide
  const moodMap: Record<string, string> = {
    stand: `${mood}_Stand`, speak: `${mood}_Speak`,
    appear: `${mood}_Appear`, hide: `${mood}_Hide`,
  }
  const moodKey = moodMap[key]
  if (moodKey) {
    const p = findPath(gender, 'Adult', moodKey)
    if (p) return p
  }

  // mood 专属交互: 从 swf-assets.json 中随机选一个
  const interactPrefix = `${mood}_interact_`
  if (key.startsWith('interact')) {
    const p = findRandomByPrefix(gender, 'Adult', interactPrefix)
    if (p) return p
  }

  return null
}

// Play 动画
export const EGG_PLAY_COUNT = 29
export const KID_PLAY_COUNT = 112
export const ADULT_PLAY_COUNT: Record<AdultMood, number> = {
  happy: 47, peaceful: 100, prostrate: 46, sad: 22, upset: 23,
}

export function getPlayAnimPath(index: number, gender: Gender, stage: Stage, adultMood: AdultMood): string {
  if (stage === 'Egg') {
    const i = (index % EGG_PLAY_COUNT) + 1
    const p = findPath(gender, 'Egg', `play_P${i}`)
    if (p) return p
  }
  if (stage === 'Kid') {
    const i = (index % KID_PLAY_COUNT) + 1
    const p = findPath(gender, 'Kid', `play_P${i}`)
    if (p) return p
  }
  const count = ADULT_PLAY_COUNT[adultMood] || 47
  const i = (index % count) + 1
  const p = findPath(gender, 'Adult', `${adultMood}_play_P${i}`)
  if (p) return p
  // fallback
  return findPath(gender, 'Kid', 'Stand') || ''
}

export function getPlayAnimPaths(gender: Gender, stage: Stage, adultMood: AdultMood): string[] {
  if (stage === 'Egg') return Array.from({ length: EGG_PLAY_COUNT }, (_, i) => getPlayAnimPath(i, gender, stage, adultMood))
  if (stage === 'Kid') return Array.from({ length: KID_PLAY_COUNT }, (_, i) => getPlayAnimPath(i, gender, stage, adultMood))
  const count = ADULT_PLAY_COUNT[adultMood] || 47
  return Array.from({ length: count }, (_, i) => getPlayAnimPath(i, gender, stage, adultMood))
}

export const ANIM_DURATIONS: Partial<Record<AnimKey, number>> = {
  first: 5000, appear: 2000, hide: 2000,
  enter1: 3000, enter2: 3000, enter3: 3000,
  exit1: 3000, exit2: 3000, exit3: 3000, exit4: 3000,
  stand: 5000, speak: 4000,
  eat: 5000, clean: 4000, dirty: 3000,
  cure: 4000, sick: 4000, hungry: 3000,
  dying: 5000, die: 5000, bury: 4000, revival: 4000,
  levUp: 5000,
  hideLeft1: 3000, hideLeft2: 3000,
  hideRight1: 3000, hideRight2: 3000,
  interactH1: 3000, interactH2: 3000, interactH3: 3000, interactH4: 3000,
  interactM1: 3000, interactM2: 3000,
  interactFall: 3000, interactS1: 3000, interactS2: 3000,
  interactE1: 3000, interactE2: 3000, interactE3: 3000,
  interactF1: 3000, interactF2: 3000, interactF3: 3000, interactF4: 3000, interactF5: 3000,
}

export { locales } from './locales'
