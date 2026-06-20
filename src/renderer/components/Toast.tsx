import { useState, useEffect } from 'react'

interface ToastProps {
  text: string
  visible: boolean
  duration?: number
  onHidden?: () => void
}

export function Toast({ text, visible, duration = 2000, onHidden }: ToastProps) {
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
    <div className={`toast ${show ? 'show' : ''}`}>
      {text}
    </div>
  )
}
