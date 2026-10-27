import { useEffect, useRef } from 'react'

// 화면이 보일 때만 일정 간격으로 다시 불러온다.
// 앞 요청이 끝난 뒤에 다음 타이머를 걸어 느린 네트워크에서 요청이 겹치지 않게 한다.
export const usePolling = (callback: () => Promise<unknown> | void, intervalMs: number, enabled = true) => {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled) return

    let timer: ReturnType<typeof setTimeout> | undefined
    let stopped = false

    const run = () => Promise.resolve(callbackRef.current()).catch(() => undefined)

    const tick = async () => {
      if (document.visibilityState !== 'hidden') await run()
      if (!stopped) timer = setTimeout(tick, intervalMs)
    }

    // 카톡 등 다른 앱에 갔다가 돌아오면 기다리지 않고 바로 새로고침
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void run()
    }

    timer = setTimeout(tick, intervalMs)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      stopped = true
      if (timer) clearTimeout(timer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [intervalMs, enabled])
}
