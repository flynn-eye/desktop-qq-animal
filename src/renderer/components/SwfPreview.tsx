import { useEffect, useRef } from 'react'

interface SwfPreviewProps {
  src: string
  width?: number
  height?: number
}

export function SwfPreview({ src, width = 80, height = 80 }: SwfPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let destroyed = false

    const init = () => {
      const Ruffle = (window as any).RufflePlayer
      if (!Ruffle) return

      Ruffle.config = {
        autoplay: 'on',
        unmuteOverlay: 'hidden',
        contextMenu: 'off',
        showSplashScreen: false,
        splashScreen: false,
      }

      const ruffle = Ruffle.newest()
      const player = ruffle.createPlayer()
      player.style.width = `${width}px`
      player.style.height = `${height}px`
      player.style.display = 'block'
      player.style.background = 'transparent'

      if (destroyed) {
        player.remove()
        return
      }

      container.appendChild(player)
      playerRef.current = player

      player.load({
        url: src,
        wmode: 'transparent',
        autoplay: true,
        unmuteOverlay: 'hidden',
        contextMenu: 'off',
        backgroundColor: 'transparent',
        letterbox: 'off',
        showSplashScreen: false,
      })
    }

    if ((window as any).RufflePlayer?.newest) {
      init()
    } else {
      const timer = setInterval(() => {
        if ((window as any).RufflePlayer?.newest) {
          clearInterval(timer)
          init()
        }
      }, 50)
      return () => {
        clearInterval(timer)
        destroyed = true
        if (playerRef.current) {
          playerRef.current.remove()
          playerRef.current = null
        }
      }
    }

    return () => {
      destroyed = true
      if (playerRef.current) {
        playerRef.current.remove()
        playerRef.current = null
      }
    }
  }, [src, width, height])

  return (
    <div
      ref={containerRef}
      style={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    />
  )
}
