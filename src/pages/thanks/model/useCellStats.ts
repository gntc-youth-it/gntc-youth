import { useCallback, useEffect, useRef, useState } from 'react'
import { HttpError } from '../../../shared/api'
import { usePolling } from '../../../shared/lib'
import { fetchCellStats } from '../api/thanksApi'
import { THANKS_ERROR_CODE } from './types'
import type { ThanksCellStatsResponse } from './types'

const POLL_INTERVAL_MS = 30 * 1000

// 구역 현황. 보고 있는 동안 30초마다 새로 불러온다
export const useCellStats = (cellId: number) => {
  // 불러오는 중이면 null
  const [stats, setStats] = useState<ThanksCellStatsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  // 다른 구역으로 바꾼 뒤에 늦게 온 응답이나, 더 새로운 요청이 있을 때 먼저 보낸 요청의 응답은 버린다
  const requestSeq = useRef(0)

  const load = useCallback(async () => {
    const seq = ++requestSeq.current
    try {
      const next = await fetchCellStats(cellId)
      if (seq !== requestSeq.current) return
      setStats(next)
      setError(null)
    } catch (loadError) {
      if (seq !== requestSeq.current) return
      setError(
        loadError instanceof HttpError && loadError.code === THANKS_ERROR_CODE.CELL_ACCESS_DENIED
          ? '내 구역 현황만 볼 수 있어요.'
          : '구역 현황을 불러오지 못했어요.'
      )
    }
  }, [cellId])

  useEffect(() => {
    setStats(null)
    setError(null)
    void load()
  }, [load])

  usePolling(load, POLL_INTERVAL_MS)

  return { stats, error, reload: load }
}
