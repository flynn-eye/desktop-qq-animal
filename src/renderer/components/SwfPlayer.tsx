import { useEffect, useRef } from 'react'

interface SwfPlayerProps {
  src: string
}

export function SwfPlayer({ src }: SwfPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const ruffleRef = useRef<any>(null)

  const loadSwf = async (swfPath: string) => {
    if (!playerRef.current) return
    try {
      await playerRef.current.load({
        url: swfPath,
        wmode: 'transparent',
        autoplay: true,
        unmuteOverlay: 'hidden',
        contextMenu: 'off',
        backgroundColor: 'transparent',
        letterbox: 'off',
        showSplashScreen: false,
      })
    } catch (e) {
      console.warn('加载SWF失败:', swfPath, e)
    }
  }

  // 初始化 Ruffle（ruffle.js 已在 index.html 预加载）
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let destroyed = false

    const init = () => {
      const Ruffle = (window as any).RufflePlayer
      if (!Ruffle) {
        console.warn('Ruffle not loaded')
        return
      }

      Ruffle.config = {
        autoplay: 'on',
        unmuteOverlay: 'hidden',
        contextMenu: 'off',
        showSplashScreen: false,
        splashScreen: false,
      }

      ruffleRef.current = Ruffle.newest()
      const player = ruffleRef.current.createPlayer()
      player.style.width = '260px'
      player.style.height = '200px'
      player.style.display = 'block'
      player.style.background = 'transparent'

      if (destroyed) {
        player.remove()
        return
      }

      container.appendChild(player)
      playerRef.current = player

      if (src) loadSwf(src)
    }

    // Ruffle 可能还在初始化，等 ready
    if ((window as any).RufflePlayer?.newest) {
      init()
    } else {
      window.addEventListener('ruffle-ready', init, { once: true })
      // fallback: 轮询等待
      const timer = setInterval(() => {
        if ((window as any).RufflePlayer?.newest) {
          clearInterval(timer)
          init()
        }
      }, 50)
      return () => {
        clearInterval(timer)
        window.removeEventListener('ruffle-ready', init)
      }
    }

    return () => {
      destroyed = true
      if (playerRef.current) {
        playerRef.current.remove()
        playerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (src && playerRef.current) loadSwf(src)
  }, [src])

  return (
    <div
      ref={containerRef}
      className="swf-player"
      style={{
        width: 260,
        height: 200,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    />
  )
}
