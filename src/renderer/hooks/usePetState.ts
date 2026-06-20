import { useState, useCallback, useRef, useEffect } from 'react'
import type { PetState, AnimKey, Gender, Stage, AdultMood } from '../types'
import { getAnimFile, ANIM_DURATIONS, assetPath } from '../config/animations'

const INITIAL_STATE: PetState = {
  hunger: 80,
  mood: 80,
  clean: 80,
  health: 100,
  exp: 0,
  level: 1,
  alive: true,
  busy: false,
}

export function usePetState(gender: Gender, stage: Stage, adultMood: AdultMood) {
  const [state, setState] = useState<PetState>(INITIAL_STATE)
  const stateRef = useRef(state)
  stateRef.current = state

  const [currentSwf, setCurrentSwf] = useState<string>('')
  const [statusPanelVisible, setStatusPanelVisible] = useState(false)
  const busyTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const genderRef = useRef(gender)
  genderRef.current = gender
  const stageRef = useRef(stage)
  stageRef.current = stage
  const moodRef = useRef(adultMood)
  moodRef.current = adultMood

  const getExpNeeded = useCallback((level: number) => level * 100, [])

  const setBusy = useCallback((busy: boolean) => {
    setState(prev => ({ ...prev, busy }))
  }, [])

  const playAnim = useCallback((key: AnimKey, callback?: () => void) => {
    const file = getAnimFile(key, genderRef.current, stageRef.current, moodRef.current)
    if (!file) {
      callback?.()
      return
    }
    const duration = ANIM_DURATIONS[key] ?? 3000

    clearTimeout(busyTimerRef.current)
    setState(prev => ({ ...prev, busy: true }))

    const isAbsolute = file.startsWith('./assets/')
    setCurrentSwf(isAbsolute ? file : assetPath(file, genderRef.current, stageRef.current))

    busyTimerRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, busy: false }))
      callback?.()
    }, duration)
  }, [])

  const playAnimFile = useCallback((filePath: string, duration: number, callback?: () => void) => {
    clearTimeout(busyTimerRef.current)
    setState(prev => ({ ...prev, busy: true }))
    setCurrentSwf(filePath)

    busyTimerRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, busy: false }))
      callback?.()
    }, duration)
  }, [])

  const addExp = useCallback((amount: number) => {
    let leveledUp = false
    setState(prev => {
      let newExp = prev.exp + amount
      let newLevel = prev.level
      const needed = newLevel * 100
      if (newExp >= needed) {
        newExp -= needed
        newLevel++
        leveledUp = true
      }
      return { ...prev, exp: newExp, level: newLevel }
    })
    return leveledUp
  }, [])

  const updateStats = useCallback((partial: Partial<PetState>) => {
    setState(prev => ({ ...prev, ...partial }))
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        if (!prev.alive) return prev
        const hunger = Math.max(0, prev.hunger - 0.5)
        const mood = Math.max(0, prev.mood - 0.3)
        const clean = Math.max(0, prev.clean - 0.4)
        let health = prev.health
        if (hunger < 20 || clean < 20) {
          health = Math.max(0, health - 0.5)
        } else if (hunger > 50 && clean > 50 && mood > 50) {
          health = Math.min(100, health + 0.2)
        }
        return { ...prev, hunger, mood, clean, health }
      })
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const resetState = useCallback(() => {
    setState(prev => ({
      ...prev,
      alive: true,
      hunger: 50,
      mood: 50,
      clean: 50,
      health: 80,
    }))
  }, [])

  return {
    state,
    currentSwf,
    statusPanelVisible,
    setStatusPanelVisible,
    getExpNeeded,
    playAnim,
    playAnimFile,
    addExp,
    updateStats,
    resetState,
    setBusy,
  }
}
