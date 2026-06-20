import { useState, useEffect, useCallback } from 'react'

export interface TokenSnapshot {
  externalTotal: number
  externalDelta: number
  appConsumed: number
  totalConsumed: number
  coins: number
  lastScanTime: number
  scanning: boolean
  breakdown: Record<string, { tokens: number; cost: number }>
  tokensPerCoin: number
}

const DEFAULT_SNAPSHOT: TokenSnapshot = {
  externalTotal: 0,
  externalDelta: 0,
  appConsumed: 0,
  totalConsumed: 0,
  coins: 0,
  lastScanTime: 0,
  scanning: false,
  breakdown: {},
  tokensPerCoin: 10000,
}

export function useTokenLedger() {
  const [snapshot, setSnapshot] = useState<TokenSnapshot>(DEFAULT_SNAPSHOT)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    window.desktopPet.tokenGetSnapshot().then((s) => {
      if (mounted) {
        setSnapshot(s)
        setLoading(false)
      }
    })

    window.desktopPet.onTokenUpdated((s) => {
      if (mounted) setSnapshot(s)
    })

    return () => { mounted = false }
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const s = await window.desktopPet.tokenForceRefresh()
      setSnapshot(s)
    } finally {
      setLoading(false)
    }
  }, [])

  const addConsumption = useCallback(async (tokens: number) => {
    const s = await window.desktopPet.tokenAddConsumption(tokens)
    setSnapshot(s)
  }, [])

  return { snapshot, loading, refresh, addConsumption }
}
