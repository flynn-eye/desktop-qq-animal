import { useState, useCallback, useRef, useEffect } from 'react'
import type { PetState, AnimKey, Gender, Stage, AdultMood } from '../types'
import { getAnimFile, ANIM_DURATIONS } from '../config/animations'

const INITIAL_STATE: PetState = {
  hunger: 80,
  mood: 80,
  clean: 80,
  health: 100,
  energy: 0,
  exp: 0,
  level: 1,
  alive: true,
  busy: false,
}

// 能量等级 → [衰减倍率, 经验倍率]
function getEnergyRates(energy: number): [number, number] {
  if (energy >= 80) return [0.5, 2.0]
  if (energy >= 60) return [0.7, 1.5]
  if (energy >= 30) return [1.0, 1.0]
  if (energy >= 10) return [1.5, 0.5]
  return [2.0, 0.2]
}

// 根据状态动态计算 adultMood
function calcAdultMood(hunger: number, mood: number, clean: number, health: number): AdultMood {
  if (health < 10) return 'prostrate'
  if (health < 30) return 'upset'
  const avg = (hunger + mood + clean) / 3
  if (avg < 30) return 'sad'
  if (avg < 60) return 'peaceful'
  return 'happy'
}

export function usePetState(gender: Gender, stage: Stage) {
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

  const getExpNeeded = useCallback((level: number) => level * 100, [])

  const setBusy = useCallback((busy: boolean) => {
    setState(prev => ({ ...prev, busy }))
  }, [])

  const playAnim = useCallback((key: AnimKey, callback?: () => void) => {
    const cur = stateRef.current
    const adultMood = calcAdultMood(cur.hunger, cur.mood, cur.clean, cur.health)
    const file = getAnimFile(key, genderRef.current, stageRef.current, adultMood)
    if (!file) {
      callback?.()
      return
    }
    const duration = ANIM_DURATIONS[key] ?? 3000

    clearTimeout(busyTimerRef.current)
    setState(prev => ({ ...prev, busy: true }))

    setCurrentSwf(file)

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
      const [, expMult] = getEnergyRates(prev.energy)
      let newExp = prev.exp + Math.floor(amount * expMult)
      let newLevel = prev.level
      const needed = newLevel * 100
      while (newExp >= needed) {
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

  const updateEnergy = useCallback((coins: number) => {
    const energy = Math.min(100, coins)
    setState(prev => {
      if (prev.energy === energy) return prev
      return { ...prev, energy }
    })
  }, [])

  // 属性衰减（受能量倍率影响）
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        if (!prev.alive) return prev
        const [decayMult] = getEnergyRates(prev.energy)
        const hunger = Math.max(0, prev.hunger - 0.5 * decayMult)
        const mood = Math.max(0, prev.mood - 0.3 * decayMult)
        const clean = Math.max(0, prev.clean - 0.4 * decayMult)
        let health = prev.health
        if (hunger < 20 || clean < 20) {
          health = Math.max(0, health - 0.5 * decayMult)
        } else if (hunger > 50 && clean > 50 && mood > 50) {
          health = Math.min(100, health + 0.2)
        }
        return { ...prev, hunger, mood, clean, health }
      })
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  // 被动经验（每30秒，受能量倍率影响）
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        if (!prev.alive) return prev
        const [, expMult] = getEnergyRates(prev.energy)
        let newExp = prev.exp + Math.floor(1 * expMult)
        let newLevel = prev.level
        const needed = newLevel * 100
        while (newExp >= needed) {
          newExp -= needed
          newLevel++
        }
        return { ...prev, exp: newExp, level: newLevel }
      })
    }, 30000)
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
    updateEnergy,
    resetState,
    setBusy,
  }
}
