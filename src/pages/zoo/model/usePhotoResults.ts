import { useCallback, useEffect, useState } from 'react'
import { fetchZooPhotoResults } from '../api/zooPhotoApi'
import type { ZooPhotoResultsResponse } from './photo'

export type PhotoResultsLoadState = 'loading' | 'ready' | 'error'

// 운영자 결과 화면. 결과를 열 때와 새로고침을 누를 때만 받는다
export const usePhotoResults = () => {
  const [results, setResults] = useState<ZooPhotoResultsResponse | null>(null)
  const [loadState, setLoadState] = useState<PhotoResultsLoadState>('loading')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshFailed, setRefreshFailed] = useState(false)

  const load = useCallback(async () => {
    setIsRefreshing(true)
    setRefreshFailed(false)
    try {
      setResults(await fetchZooPhotoResults())
      setLoadState('ready')
    } catch {
      // 이미 보여주던 결과는 그대로 두고 새로고침만 실패했다고 알린다
      setLoadState((prev) => (prev === 'loading' ? 'error' : prev))
      setRefreshFailed(true)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { results, loadState, isRefreshing, refreshFailed, reload: load }
}
