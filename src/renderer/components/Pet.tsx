import { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import { SwfPlayer } from './SwfPlayer'
import { SpeechBubble } from './SpeechBubble'
import { StatusPanel } from './StatusPanel'
import { TokenPanel } from './TokenPanel'
import { GenderSelect } from './GenderSelect'
import { Toast } from './Toast'
import { usePetState } from '../hooks/usePetState'
import { useTokenLedger } from '../hooks/useTokenLedger'
import { useLifecycle } from '../hooks/useLifecycle'
import { useDrag } from '../hooks/useDrag'
import { useChat } from '../hooks/useChat'
import { useAgentEvents } from '../hooks/useAgentEvents'
import {
  getPlayAnimPath,
  locales,
} from '../config/animations'
import type { AnimKey, AdultMood } from '../types'

const INTERACT_HEAD: AnimKey[] = ['interactH1', 'interactH2', 'interactH3']
const INTERACT_BODY: AnimKey[] = ['interactM1']
const INTERACT_FEET: AnimKey[] = ['interactFall']
const HIDE_ANIMS: AnimKey[] = ['hideLeft1', 'hideLeft2', 'hideRight1', 'hideRight2']
const ALL_INTERACT: AnimKey[] = ['interactH1', 'interactH2', 'interactH3', 'interactM1', 'interactM2', 'interactFall', 'interactS1', 'interactS2']

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function calcAdultMood(hunger: number, mood: number, clean: number, health: number): AdultMood {
  if (health < 10) return 'prostrate'
  if (health < 30) return 'upset'
  const avg = (hunger + mood + clean) / 3
  if (avg < 30) return 'sad'
  if (avg < 60) return 'peaceful'
  return 'happy'
}

export function Pet() {
  const { lifecycle, isNewUser, selectGender, evolve } = useLifecycle()
  const { gender, stage } = lifecycle

  const {
    state, currentSwf, statusPanelVisible,
    setStatusPanelVisible, getExpNeeded,
    playAnim, playAnimFile, addExp, updateStats, updateEnergy, resetState,
  } = usePetState(gender!, stage)

  const { snapshot: tokenSnapshot, loading: tokenLoading, refresh: tokenRefresh } = useTokenLedger()
  const { didDrag, onPointerDown } = useDrag()

  const [bubbleText, setBubbleText] = useState('')
  const [bubbleVisible, setBubbleVisible] = useState(false)
  const [toastText, setToastText] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [tokenPanelVisible, setTokenPanelVisible] = useState(false)

  const stateRef = useRef(state)
  stateRef.current = state

  // 动态 adultMood
  const adultMood = useMemo(
    () => calcAdultMood(state.hunger, state.mood, state.clean, state.health),
    [state.hunger, state.mood, state.clean, state.health]
  )

  const showBubble = useCallback((text: string) => {
    setBubbleText(text)
    setBubbleVisible(true)
  }, [])

  const showToastMsg = useCallback((text: string) => {
    setToastText(text)
    setToastVisible(true)
  }, [])

  // Token 余额 → 能量
  useEffect(() => {
    if (gender) {
      updateEnergy(tokenSnapshot.coins)
    }
  }, [tokenSnapshot.coins, gender, updateEnergy])

  const playRandomPlay = useCallback(() => {
    const g = gender!
    const cur = stateRef.current
    const mood = calcAdultMood(cur.hunger, cur.mood, cur.clean, cur.health)
    const idx = Math.floor(Math.random() * 200)
    const path = getPlayAnimPath(idx, g, stage, mood)
    playAnimFile(path, 5000)
  }, [gender, stage, playAnimFile])

  const doFeed = useCallback(() => {
    const cur = stateRef.current
    if (!cur.alive) return
    const half = cur.energy < 10 ? 0.5 : 1
    updateStats({
      hunger: Math.min(100, cur.hunger + 30 * half),
      mood: Math.min(100, cur.mood + 5 * half),
    })
    addExp(10)
    playAnim('eat')
  }, [updateStats, addExp, playAnim])

  const doWash = useCallback(() => {
    const cur = stateRef.current
    if (!cur.alive) return
    const half = cur.energy < 10 ? 0.5 : 1
    updateStats({
      clean: Math.min(100, cur.clean + 40 * half),
      mood: Math.min(100, cur.mood + 5 * half),
    })
    addExp(8)
    playAnim('clean')
  }, [updateStats, addExp, playAnim])

  const doCure = useCallback(() => {
    const cur = stateRef.current
    if (!cur.alive || cur.health >= 80) return
    const half = cur.energy < 10 ? 0.5 : 1
    updateStats({
      health: Math.min(100, cur.health + 30 * half),
      mood: Math.min(100, cur.mood + 5 * half),
    })
    addExp(15)
    playAnim('cure')
  }, [updateStats, addExp, playAnim])

  const doPlayWithPet = useCallback(() => {
    const cur = stateRef.current
    if (!cur.alive) return
    const half = cur.energy < 10 ? 0.5 : 1
    updateStats({
      mood: Math.min(100, cur.mood + 25 * half),
      hunger: Math.max(0, cur.hunger - 5),
    })
    addExp(12)
    playRandomPlay()
  }, [updateStats, addExp, playRandomPlay])

  const { sendMessage: sendChat, loading: chatLoading } = useChat({
    petState: state,
    onSay: showBubble,
    onPlayAnim: (key) => playAnim(key),
    onFeed: doFeed,
    onWash: doWash,
    onCure: doCure,
    onPlay: doPlayWithPet,
  })

  useAgentEvents(playRandomPlay, showBubble)

  const clickCountRef = useRef(0)
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleSingleClick = useCallback((relY: number) => {
    const cur = stateRef.current
    if (!cur.alive) return

    const { clickPhrases } = locales
    if (relY < 0.3) {
      updateStats({ mood: Math.min(100, cur.mood + 8) })
      addExp(3)
      showBubble(pick(clickPhrases.slice(0, 1)))
      playAnim(pick(INTERACT_HEAD))
    } else if (relY < 0.7) {
      updateStats({ mood: Math.min(100, cur.mood + 5) })
      addExp(2)
      showBubble(clickPhrases[1])
      playAnim(pick(INTERACT_BODY))
    } else {
      updateStats({ mood: Math.min(100, cur.mood + 3) })
      addExp(1)
      showBubble(clickPhrases[2])
      playAnim(pick(INTERACT_FEET))
    }
  }, [updateStats, addExp, showBubble, playAnim])

  const handleTripleClick = useCallback(() => {
    const cur = stateRef.current
    if (!cur.alive) return
    showBubble(locales.clickPhrases[3])
    updateStats({ mood: Math.min(100, cur.mood + 20) })
    addExp(20)
    playRandomPlay()
  }, [updateStats, addExp, showBubble, playRandomPlay])

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0 || didDrag.current) return
    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    const relY = (e.clientY - rect.top) / rect.height

    clickCountRef.current++
    clearTimeout(clickTimerRef.current)

    clickTimerRef.current = setTimeout(() => {
      const count = clickCountRef.current
      clickCountRef.current = 0

      if (count === 1) {
        handleSingleClick(relY)
      } else if (count >= 3) {
        handleTripleClick()
      }
    }, 250)
  }, [didDrag, handleSingleClick, handleTripleClick])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const { contextMenu } = locales
    window.desktopPet.showContextMenu([
      { id: 'feed', label: contextMenu.feed },
      { id: 'wash', label: contextMenu.wash },
      { id: 'cure', label: contextMenu.cure },
      { id: 'play', label: contextMenu.play },
      { id: 'speak', label: contextMenu.speak },
      { id: 'askai', label: '让AI互动' },
      { id: 'walk', label: contextMenu.walk },
      { type: 'separator' },
      { id: 'status', label: statusPanelVisible ? contextMenu.hideStatus : contextMenu.showStatus },
      { id: 'token', label: tokenPanelVisible ? contextMenu.hideToken : contextMenu.showToken },
      { id: 'revive', label: contextMenu.revive },
      { type: 'separator' },
      { id: 'quit', label: contextMenu.quit },
    ])
  }, [statusPanelVisible, tokenPanelVisible])

  useEffect(() => {
    window.desktopPet.onContextMenuClick((id: string) => {
      const cur = stateRef.current
      const { feedback, menuSpeakPhrases } = locales
      switch (id) {
        case 'feed': {
          if (!cur.alive) return showToastMsg(feedback.alreadyDead)
          const half = cur.energy < 10 ? 0.5 : 1
          updateStats({
            hunger: Math.min(100, cur.hunger + 30 * half),
            mood: Math.min(100, cur.mood + 5 * half),
          })
          addExp(10)
          showBubble(feedback.feed)
          playAnim('eat')
          break
        }
        case 'wash': {
          if (!cur.alive) return showToastMsg(feedback.alreadyDead)
          const half = cur.energy < 10 ? 0.5 : 1
          updateStats({
            clean: Math.min(100, cur.clean + 40 * half),
            mood: Math.min(100, cur.mood + 5 * half),
          })
          addExp(8)
          showBubble(feedback.wash)
          playAnim('clean')
          break
        }
        case 'cure': {
          if (!cur.alive) return showToastMsg(feedback.alreadyDead)
          if (cur.health >= 80) return showToastMsg(feedback.healthy)
          const half = cur.energy < 10 ? 0.5 : 1
          updateStats({
            health: Math.min(100, cur.health + 30 * half),
            mood: Math.min(100, cur.mood + 5 * half),
          })
          addExp(15)
          showBubble(feedback.cure)
          playAnim('cure')
          break
        }
        case 'play': {
          if (!cur.alive) return showToastMsg(feedback.alreadyDead)
          const half = cur.energy < 10 ? 0.5 : 1
          updateStats({
            mood: Math.min(100, cur.mood + 25 * half),
            hunger: Math.max(0, cur.hunger - 5),
          })
          addExp(12)
          showBubble(feedback.play)
          playRandomPlay()
          break
        }
        case 'speak':
          if (!cur.busy) {
            showBubble(pick(menuSpeakPhrases))
            playAnim('speak')
          }
          break
        case 'askai':
          sendChat('')
          break
        case 'walk':
          doRandomWalk()
          break
        case 'status':
          setStatusPanelVisible(prev => !prev)
          break
        case 'token':
          setTokenPanelVisible(prev => !prev)
          break
        case 'revive':
          if (cur.alive) return showToastMsg(feedback.alreadyAlive)
          resetState()
          showBubble(feedback.revive)
          playAnim('revival')
          break
        case 'quit':
          window.desktopPet.quit()
          break
      }
    })
  }, [updateStats, addExp, showBubble, showToastMsg, playAnim, playRandomPlay, resetState, setStatusPanelVisible, sendChat])

  const doRandomWalk = useCallback(async () => {
    const cur = stateRef.current
    if (cur.busy) return
    const pos = await window.desktopPet.getWindowPosition()
    const screen = await window.desktopPet.getScreenSize()
    const dx = (Math.random() - 0.5) * 200
    const newX = Math.max(0, Math.min(screen.width - 300, pos[0] + dx))
    window.desktopPet.setWindowPosition(newX, pos[1])
    playAnim('stand')
  }, [playAnim])

  useEffect(() => {
    const randomBehaviors = [
      () => {
        const cur = stateRef.current
        if (cur.busy) return
        showBubble(pick(locales.speechPhrases))
        playAnim('speak')
      },
      () => {
        const cur = stateRef.current
        if (cur.busy) return
        doRandomWalk()
      },
      () => {
        const cur = stateRef.current
        if (cur.busy) return
        showBubble(locales.feedback.hideSeek)
        playAnim(pick(HIDE_ANIMS))
      },
      () => {
        const cur = stateRef.current
        if (cur.busy) return
        playAnim(pick(ALL_INTERACT))
      },
      () => {
        const cur = stateRef.current
        if (cur.busy) return
        playRandomPlay()
      },
      () => {
        const cur = stateRef.current
        if (cur.busy) return
        playAnim('stand')
      },
    ]

    const scheduleNext = () => {
      const delay = 8000 + Math.random() * 7000
      return setTimeout(() => {
        const cur = stateRef.current
        if (cur.alive && !cur.busy) {
          pick(randomBehaviors)()
        }
        timerRef.current = scheduleNext()
      }, delay)
    }

    const timerRef = { current: scheduleNext() }
    return () => clearTimeout(timerRef.current)
  }, [showBubble, playAnim, playAnimFile, playRandomPlay, doRandomWalk])

  // 每分钟自动与大模型交互
  useEffect(() => {
    if (!gender) return
    const interval = setInterval(() => {
      const cur = stateRef.current
      if (!cur.alive || cur.busy || chatLoading) return
      sendChat('')
    }, 60000)
    return () => clearInterval(interval)
  }, [gender, sendChat, chatLoading])

  // 初始入场
  useEffect(() => {
    if (!gender) return
    playAnim('first', () => {
      playAnim('stand')
    })
    showBubble(locales.feedback.welcome)
    // 动画加载完成后显示窗口
    window.desktopPet.showWindow()
  }, [gender])

  // 低能量提示
  useEffect(() => {
    if (state.alive && state.energy < 10 && state.energy > 0 && !state.busy) {
      showBubble(locales.feedback.lowEnergy)
    }
  }, [state.energy, state.alive, state.busy])

  // 状态事件触发
  useEffect(() => {
    if (!state.alive) return
    if (state.health <= 0) {
      showBubble(locales.feedback.dying)
      playAnim('dying', () => {
        playAnim('die', () => {
          playAnim('bury')
          showToastMsg(locales.feedback.deadToast)
          updateStats({ alive: false })
        })
      })
      return
    }
    if (state.hunger <= 15 && !state.busy) {
      showBubble(locales.feedback.hungry)
      playAnim('hungry')
    } else if (state.clean <= 15 && !state.busy) {
      showBubble(locales.feedback.dirty)
      playAnim('dirty')
    } else if (state.mood <= 15 && !state.busy) {
      showBubble(locales.feedback.bored)
    }
  }, [state.hunger, state.clean, state.mood, state.health, state.alive, state.busy])

  // 升级时检查是否进化
  useEffect(() => {
    if (stage === 'Egg' && state.level >= 3) {
      evolve()
      showBubble('蛋孵化了!')
      playAnim('first', () => playAnim('stand'))
    } else if (stage === 'Kid' && state.level >= 10) {
      evolve()
      showBubble('长大了!')
      playAnim('first', () => playAnim('stand'))
    }
  }, [state.level, stage, evolve, showBubble, playAnim])

  // DevTools 调试方法
  useEffect(() => {
    (window as any).__pet = {
      addExp: (n: number) => addExp(n),
      levelUp: () => { for (let i = 0; i < 50; i++) addExp(999) },
      setEnergy: (n: number) => updateStats({ energy: Math.min(100, Math.max(0, n)) }),
      setAll: (n: number) => updateStats({ hunger: n, mood: n, clean: n, health: n }),
      state: () => stateRef.current,
    }
    console.log('[Pet] DevTools: window.__pet.addExp(100), window.__pet.levelUp(), window.__pet.setEnergy(80)')
  }, [addExp, updateStats])

  if (isNewUser || !gender) {
    return <GenderSelect onSelect={selectGender} />
  }

  return (
    <div className="pet-container">
      <SpeechBubble text={bubbleText} visible={bubbleVisible} onHidden={() => setBubbleVisible(false)} />
      <div className="pet-swf-wrapper">
        <SwfPlayer src={currentSwf} />
        <div
          className="pet-interact-layer"
          onPointerDown={onPointerDown}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
        />
      </div>
      <StatusPanel visible={statusPanelVisible} state={state} getExpNeeded={getExpNeeded} />
      <TokenPanel visible={tokenPanelVisible} snapshot={tokenSnapshot} loading={tokenLoading} onRefresh={tokenRefresh} />
      <Toast text={toastText} visible={toastVisible} onHidden={() => setToastVisible(false)} />
    </div>
  )
}
