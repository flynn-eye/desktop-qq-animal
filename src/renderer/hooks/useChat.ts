import { useState, useCallback, useRef } from 'react'
import type { PetState, AnimKey } from '../types'

interface ToolCall {
  id: string
  name: string
  args: Record<string, unknown>
  cost: number
}

interface ChatResult {
  text: string
  tools: ToolCall[]
}

interface ChatOptions {
  petState: PetState
  onSay: (text: string) => void
  onPlayAnim: (key: AnimKey) => void
  onFeed: () => void
  onWash: () => void
  onCure: () => void
  onPlay: () => void
}

export function useChat(options: ChatOptions) {
  const [loading, setLoading] = useState(false)
  const optionsRef = useRef(options)
  optionsRef.current = options

  const sendMessage = useCallback(async (message: string) => {
    console.log('[useChat] sendMessage called, message:', message || '(empty)')
    setLoading(true)
    try {
      const result: ChatResult = await window.desktopPet.aiChat({
        message,
        petState: optionsRef.current.petState,
      })
      console.log('[useChat] result:', JSON.stringify({ text: result.text, toolCount: result.tools.length, tools: result.tools.map(t => t.name) }))

      let saidSomething = false

      for (const tool of result.tools) {
        if (tool.name === 'say') saidSomething = true
        executeTool(tool)
      }

      // 只有当工具没有说话时，才用 result.text 说话
      if (result.text && !saidSomething) {
        optionsRef.current.onSay(result.text)
      }

      return result
    } catch (err: any) {
      console.error('[useChat] error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const executeTool = useCallback((tool: ToolCall) => {
    const opts = optionsRef.current
    switch (tool.name) {
      case 'say':
        if (tool.args.text) opts.onSay(tool.args.text as string)
        break
      case 'play_animation':
        if (tool.args.animation) opts.onPlayAnim(tool.args.animation as AnimKey)
        break
      case 'feed':
        opts.onFeed()
        break
      case 'wash':
        opts.onWash()
        break
      case 'cure':
        opts.onCure()
        break
      case 'play':
        opts.onPlay()
        break
      case 'check_balance':
        break
    }
  }, [])

  const clearHistory = useCallback(async () => {
    await window.desktopPet.aiClearHistory()
  }, [])

  return { sendMessage, loading, clearHistory }
}
