import { useCallback, useRef } from 'react'

export function useDrag() {
  const isDragging = useRef(false)
  const didDrag = useRef(false)

  const onPointerDown = useCallback(async (e: React.PointerEvent) => {
    if (e.button !== 0) return
    e.preventDefault()

    const target = e.currentTarget as HTMLElement
    const pointerId = e.pointerId

    // 使用 setPointerCapture 确保 pointerup 在鼠标移出窗口后仍能触发
    target.setPointerCapture(pointerId)

    isDragging.current = true
    didDrag.current = false

    // 通知主进程开始拖拽（主进程用光标轮询移动窗口）
    await window.desktopPet.startDrag()

    const onPointerMove = () => {
      didDrag.current = true
    }

    const onPointerUp = async () => {
      await window.desktopPet.stopDrag()
      isDragging.current = false
      target.removeEventListener('pointerup', onPointerUp)
      target.removeEventListener('pointermove', onPointerMove)
      try { target.releasePointerCapture(pointerId) } catch {}
    }

    target.addEventListener('pointerup', onPointerUp)
    target.addEventListener('pointermove', onPointerMove)
  }, [])

  return {
    isDragging,
    didDrag,
    onPointerDown,
  }
}
