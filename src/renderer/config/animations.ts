import type { AnimKey, Gender, Stage, AdultMood } from '../types'

const ASSET_BASE = './assets/Action'

export function assetPath(file: string, gender: Gender, stage: Stage): string {
  return `${ASSET_BASE}/${gender}/${stage}/${file}`
}

export function adultMoodPath(file: string, gender: Gender, mood: AdultMood): string {
  return `${ASSET_BASE}/${gender}/Adult/${mood}/${file}`
}

type AnimMapping = Partial<Record<AnimKey, string>>

const EGG_ANIMS: AnimMapping = {
  first:       'First.swf',
  appear:      'Appear.swf',
  hide:        'Hide.swf',
  enter1:      'Enter1.swf',
  enter2:      'Enter2.swf',
  exit1:       'Exit1.swf',
  exit2:       'Exit2.swf',
  exit3:       'Exit3.swf',
  stand:       'Stand.swf',
  speak:       'Speak1.swf',
  eat:         'Eat1.swf',
  clean:       'Clean.swf',
  cure:        'Cure.swf',
  sick:        'Sick.swf',
  dying:       'Dying.swf',
  die:         'Die.swf',
  bury:        'Bury.swf',
  revival:     'Revival.swf',
  levUp:       'LevUp.swf',
  hideLeft1:   'Hide_left1.swf',
  hideLeft2:   'Hide_left2.swf',
  hideRight1:  'Hide_right1.swf',
  hideRight2:  'Hide_right2.swf',
  interactH1:  'interact/H1.swf',
  interactH2:  'interact/H2.swf',
  interactH3:  'interact/H3.swf',
  interactH4:  'interact/H4.swf',
  interactM1:  'interact/M1.swf',
  interactM2:  'interact/M2.swf',
  interactE1:  'interact/E1.swf',
  interactE2:  'interact/E2.swf',
  interactE3:  'interact/E3.swf',
  interactF1:  'interact/F1.swf',
  interactF2:  'interact/F2.swf',
  interactF3:  'interact/F3.swf',
  interactF4:  'interact/F4.swf',
  interactF5:  'interact/F5.swf',
}

const KID_ANIMS: AnimMapping = {
  first:       'First.swf',
  appear:      'Appear.swf',
  hide:        'Hide.swf',
  enter1:      'Enter1.swf',
  enter2:      'Enter2.swf',
  enter3:      'Enter3.swf',
  exit1:       'Exit1.swf',
  exit2:       'Exit2.swf',
  exit3:       'Exit3.swf',
  stand:       'Stand.swf',
  speak:       'Speak.swf',
  eat:         'Eat1.swf',
  clean:       'Clean.swf',
  dirty:       'Dirty.swf',
  cure:        'Cure.swf',
  sick:        'Sick.swf',
  hungry:      'Hungry.swf',
  dying:       'Dying.swf',
  die:         'Die.swf',
  bury:        'Bury.swf',
  revival:     'Revival.swf',
  levUp:       'LevUp.swf',
  hideLeft1:   'Hide_left1.swf',
  hideLeft2:   'Hide_left2.swf',
  hideRight1:  'Hide_right1.swf',
  hideRight2:  'Hide_right2.swf',
  interactH1:  'interact/H1.swf',
  interactH2:  'interact/H2.swf',
  interactH3:  'interact/H3.swf',
  interactM1:  'interact/M1.swf',
  interactM2:  'interact/M2.swf',
  interactFall:'interact/Fall.swf',
  interactS1:  'interact/S1.swf',
  interactS2:  'interact/S2.swf',
}

const ADULT_ROOT_ANIMS: AnimMapping = {
  first:       'First.swf',
  appear:      'Appear.swf',
  hide:        'Hide.swf',
  enter1:      'Enter1.swf',
  enter2:      'Enter2.swf',
  enter3:      'Enter3.swf',
  exit1:       'Exit1.swf',
  exit2:       'Exit2.swf',
  exit3:       'Exit3.swf',
  exit4:       'Exit4.swf',
  eat:         'Eat1.swf',
  clean:       'Clean1.swf',
  cure:        'Cure1.swf',
  dying:       'Dying.swf',
  die:         'Die.swf',
  bury:        'Bury.swf',
  revival:     'Revival.swf',
  levUp:       'LevUp.swf',
  hideLeft1:   'Hide_left.swf',
  hideRight1:  'Hide_right.swf',
  sick:        'Sick1.swf',
}

const ADULT_MOOD_ANIMS: AnimMapping = {
  stand:       'Stand.swf',
  speak:       'Speak.swf',
  appear:      'Appear.swf',
  hide:        'Hide.swf',
}

export function getAnimFile(key: AnimKey, gender: Gender, stage: Stage, adultMood: AdultMood): string | null {
  if (stage === 'Egg') {
    return EGG_ANIMS[key] ?? null
  }

  if (stage === 'Kid') {
    return KID_ANIMS[key] ?? null
  }

  // Adult
  if (ADULT_MOOD_ANIMS[key]) {
    return adultMoodPath(ADULT_MOOD_ANIMS[key]!, gender, adultMood)
  }

  const rootFile = ADULT_ROOT_ANIMS[key]
  if (rootFile) {
    return assetPath(rootFile, gender, stage)
  }

  // Adult mood interact/play - use peaceful as default
  const moodDir = `${adultMood}`
  const adultInteractMap: Partial<Record<AnimKey, string>> = {
    interactH1:  `${moodDir}/interact/H1.swf`,
    interactH2:  `${moodDir}/interact/H2.swf`,
    interactH3:  `${moodDir}/interact/H3.swf`,
    interactM1:  `${moodDir}/interact/M1.swf`,
    interactM2:  `${moodDir}/interact/M2.swf`,
    interactFall:`${moodDir}/interact/F1.swf`,
    interactS1:  `${moodDir}/interact/SC1.swf`,
  }

  const file = adultInteractMap[key]
  if (file) {
    return assetPath(file, gender, stage)
  }

  return null
}

export const EGG_PLAY_COUNT = 29
export const KID_PLAY_COUNT = 112
export const ADULT_PLAY_COUNT: Record<AdultMood, number> = {
  happy: 47,
  peaceful: 100,
  prostrate: 46,
  sad: 22,
  upset: 23,
}

export function getPlayAnimPath(index: number, gender: Gender, stage: Stage, adultMood: AdultMood): string {
  if (stage === 'Egg') {
    const i = (index % EGG_PLAY_COUNT) + 1
    return assetPath(`play/P${i}.swf`, gender, stage)
  }
  if (stage === 'Kid') {
    const i = (index % KID_PLAY_COUNT) + 1
    return assetPath(`play/P${i}.swf`, gender, stage)
  }
  const count = ADULT_PLAY_COUNT[adultMood] || 47
  const i = (index % count) + 1
  return assetPath(`${adultMood}/play/P${i}.swf`, gender, stage)
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
