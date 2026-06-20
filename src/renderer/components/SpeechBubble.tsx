import { useState, useEffect } from 'react'

interface SpeechBubbleProps {
  text: string
  visible: boolean
  duration?: number
  onHidden?: () => void
}

export function SpeechBubble({ text, visible, duration = 3000, onHidden }: SpeechBubbleProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible && text) {
      setShow(true)
      const timer = setTimeout(() => {
        setShow(false)
        onHidden?.()
      }, duration)
      return () => clearTimeout(timer)
    } else {
      setShow(false)
    }
  }, [visible, text, duration, onHidden])

  return (
    <div className={`speech-bubble ${show ? 'show' : ''}`}>
      {text}
    </div>
  )
}
