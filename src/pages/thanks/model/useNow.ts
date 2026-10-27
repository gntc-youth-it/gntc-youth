import { useEffect, useState } from 'react'

// 지금 시각. 칸이 바뀌는 순간을 놓치지 않게 30초마다, 그리고 다른 앱에 갔다 돌아오면 바로 다시 읽는다
export const useNow = (): Date => {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const update = () => setNow(new Date())
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') update()
    }
    const timer = setInterval(update, 30 * 1000)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return now
}
