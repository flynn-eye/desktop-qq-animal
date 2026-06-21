export type Gender = 'GG' | 'MM'
export type Stage = 'Egg' | 'Kid' | 'Adult'
export type AdultMood = 'happy' | 'peaceful' | 'prostrate' | 'sad' | 'upset'

export interface LifecycleState {
  gender: Gender | null
  stage: Stage
  hatched: boolean
}

export interface PetState {
  hunger: number    // 0-100
  mood: number      // 0-100
  clean: number     // 0-100
  health: number    // 0-100
  energy: number    // 0-100，由Token余额决定
  exp: number
  level: number
  alive: boolean
  busy: boolean
}

export type AnimKey =
  | 'first' | 'appear' | 'hide'
  | 'enter1' | 'enter2' | 'enter3'
  | 'exit1' | 'exit2' | 'exit3' | 'exit4'
  | 'stand' | 'speak'
  | 'eat' | 'clean' | 'dirty' | 'cure' | 'sick' | 'hungry'
  | 'dying' | 'die' | 'bury' | 'revival'
  | 'levUp'
  | 'hideLeft1' | 'hideLeft2' | 'hideRight1' | 'hideRight2'
  | 'interactH1' | 'interactH2' | 'interactH3' | 'interactH4'
  | 'interactM1' | 'interactM2'
  | 'interactFall' | 'interactS1' | 'interactS2'
  | 'interactE1' | 'interactE2' | 'interactE3'
  | 'interactF1' | 'interactF2' | 'interactF3' | 'interactF4' | 'interactF5'

export interface SpeechBubble {
  text: string
  visible: boolean
}

export type MenuItemId = 'feed' | 'wash' | 'cure' | 'play' | 'speak' | 'walk' | 'status' | 'revive' | 'quit'
