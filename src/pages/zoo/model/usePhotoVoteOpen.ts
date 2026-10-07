import { useEffect, useState } from 'react'
import { PHOTO_VOTE_OPENS_AT, isPhotoVoteOpen } from './photo'

// setTimeout이 기다릴 수 있는 가장 긴 시간(약 24.8일). 더 길면 바로 실행돼 버린다
const MAX_TIMEOUT_MS = 2 ** 31 - 1

// 여는 시각이 되면 새로고침하지 않아도 바로 열린다.
// 휴대폰이 잠들었다 깨면 타이머가 늦게 울릴 수 있어서, 화면으로 돌아올 때도 다시 확인한다
export const usePhotoVoteOpen = (): boolean => {
  const [isOpen, setIsOpen] = useState(() => isPhotoVoteOpen())
  // 아직 닫혀 있는데 타이머가 울렸을 때(시계가 바뀐 경우 등) 타이머를 다시 걸기 위한 값
  const [recheckCount, setRecheckCount] = useState(0)

  useEffect(() => {
    if (isOpen) return

    const check = () => {
      if (isPhotoVoteOpen()) setIsOpen(true)
      else setRecheckCount((count) => count + 1)
    }
    const delay = Math.min(Math.max(PHOTO_VOTE_OPENS_AT.getTime() - Date.now(), 0), MAX_TIMEOUT_MS)
    const timer = setTimeout(check, delay)
    document.addEventListener('visibilitychange', check)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', check)
    }
  }, [isOpen, recheckCount])

  return isOpen
}
