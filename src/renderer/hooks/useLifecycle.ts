import { useState, useCallback, useEffect } from 'react'
import type { Gender, Stage, AdultMood, LifecycleState } from '../types'

const STORAGE_KEY = 'pet-lifecycle'

const INITIAL: LifecycleState = {
  gender: null,
  stage: 'Egg',
  adultMood: 'peaceful',
  hatched: false,
}

function loadLifecycle(): LifecycleState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...INITIAL, ...JSON.parse(raw) }
  } catch {}
  return INITIAL
}

function saveLifecycle(state: LifecycleState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export const STAGE_ORDER: Stage[] = ['Egg', 'Kid', 'Adult']

export function useLifecycle() {
  const [lifecycle, setLifecycle] = useState<LifecycleState>(loadLifecycle)

  useEffect(() => {
    saveLifecycle(lifecycle)
  }, [lifecycle])

  const isNewUser = lifecycle.gender === null

  const selectGender = useCallback((gender: Gender) => {
    setLifecycle({ ...INITIAL, gender })
  }, [])

  const hatch = useCallback(() => {
    setLifecycle(prev => ({ ...prev, hatched: true }))
  }, [])

  const evolve = useCallback(() => {
    setLifecycle(prev => {
      const idx = STAGE_ORDER.indexOf(prev.stage)
      if (idx < STAGE_ORDER.length - 1) {
        return { ...prev, stage: STAGE_ORDER[idx + 1] }
      }
      return prev
    })
  }, [])

  const setAdultMood = useCallback((mood: AdultMood) => {
    setLifecycle(prev => ({ ...prev, adultMood: mood }))
  }, [])

  const resetLifecycle = useCallback(() => {
    setLifecycle(INITIAL)
  }, [])

  return {
    lifecycle,
    isNewUser,
    selectGender,
    hatch,
    evolve,
    setAdultMood,
    resetLifecycle,
  }
}
