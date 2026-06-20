import { useEffect, useRef } from 'react'

interface SwfPlayerProps {
  src: string
}

export function SwfPlayer({ src }: SwfPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const ruffleRef = useRef<any>(null)

  // 初始化 Ruffle
  useEffect(() => {
    const init = async () => {
      if (!containerRef.current || ruffleRef.current) return

      // 动态加载 ruffle.js
      if (!(window as any).RufflePlayer) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = './ruffle/ruffle.js'
          script.onload = () => resolve()
          script.onerror = reject
          document.head.appendChild(script)
        })
      }

      // 设置全局配置
      ;(window as any).RufflePlayer = (window as any).RufflePlayer || {}
      ;(window as any).RufflePlayer.config = {
        autoplay: 'on',
        unmuteOverlay: 'hidden',
        contextMenu: 'off',
        showSplashScreen: false,
        splashScreen: false,
      }

      ruffleRef.current = (window as any).RufflePlayer.newest()
      const player = ruffleRef.current.createPlayer()
      player.style.width = '200px'
      player.style.height = '200px'
      player.style.display = 'block'
      player.style.background = 'transparent'
      containerRef.current.appendChild(player)
      playerRef.current = player

      // 加载初始动画
      if (src) {
        await loadSwf(src)
      }
    }

    init()
  }, [])

  // 加载 SWF
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

  // 当 src 变化时重新加载
  useEffect(() => {
    if (src && playerRef.current) {
      loadSwf(src)
    }
  }, [src])

  return (
    <div
      ref={containerRef}
      className="swf-player"
      style={{
        width: 200,
        height: 200,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    />
  )
}
