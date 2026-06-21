import { useEffect, useRef } from 'react'

interface AgentEvent {
  event: string
  agent: string
  tool?: string
  status?: string
  message?: string
}

const PHRASES: Record<string, string[]> = {
  session_start: ['主人开始工作啦！', '加油！', '我来陪你~', '开工！'],
  session_end: ['辛苦了主人~', '休息一下吧！', '做得好！', '完成啦~'],
  thinking: ['让我想想...', '嗯嗯...', '思考中...', '有主意了...'],
  tool_start: ['在执行任务~', '收到！', '马上处理~', '忙碌中...'],
  tool_end: ['完成啦！', '搞定了~', '做好了！', '厉害！'],
  error: ['出错了...', '哎呀...', '好像有问题...', '呜呜...'],
  idle: ['主人在忙什么呢？', '无聊...', '陪我玩嘛~', '嘿嘿~'],
}

export function useAgentEvents(
  playRandomPlay: () => void,
  showBubble: (text: string) => void,
) {
  const playRef = useRef(playRandomPlay)
  playRef.current = playRandomPlay
  const bubbleRef = useRef(showBubble)
  bubbleRef.current = showBubble

  useEffect(() => {
    window.desktopPet.onAgentEvent((data: AgentEvent) => {
      const phrases = PHRASES[data.event]
      if (!phrases) return

      playRef.current()

      const text = data.message || phrases[Math.floor(Math.random() * phrases.length)]
      bubbleRef.current(text)
    })
  }, [])
}
