import { useCallback, useEffect, useRef, useState } from 'react'
import { HttpError } from '../../../shared/api'
import { fetchZooMissionResults } from '../api/zooTeamApi'
import type { ZooMissionTeamResult } from './team'
import { usePolling } from './usePolling'

// 행사 중 진행 상황도 보도록 조 화면보다 느긋하게 다시 불러온다
export const ANSWERS_POLL_INTERVAL_MS = 30000

export type MissionAnswersLoadState = 'loading' | 'ready' | 'forbidden' | 'error'

export const useMissionAnswers = () => {
  const [teams, setTeams] = useState<ZooMissionTeamResult[]>([])
  const [loadState, setLoadState] = useState<MissionAnswersLoadState>('loading')
  const [loadedAt, setLoadedAt] = useState<Date | null>(null)
  // 보여주던 답을 새로 불러오지 못했을 때. 답은 그대로 두고 화면에 알린다
  const [refreshFailed, setRefreshFailed] = useState(false)

  // 새로고침 버튼과 주기적 새로고침이 겹쳐도 늦게 도착한 이전 응답이 더 새 답을 덮어쓰지 않도록 요청마다 순번을 매긴다
  const requestSeq = useRef(0)
  const appliedSeq = useRef(0)

  const load = useCallback(async () => {
    const seq = ++requestSeq.current
    try {
      const response = await fetchZooMissionResults()
      if (seq < appliedSeq.current) return
      appliedSeq.current = seq
      setTeams(response.teams)
      setLoadedAt(new Date())
      setRefreshFailed(false)
      setLoadState('ready')
    } catch (error) {
      // 그사이 더 나중 요청의 답을 이미 보여주고 있으면 이 실패는 무시한다
      if (seq < appliedSeq.current) return
      // 운영자 권한이 없어진 경우. 화면에서는 운영자에게만 열지만 서버가 최종으로 막는다
      if (error instanceof HttpError && error.status === 403) {
        setLoadState('forbidden')
        return
      }
      // 이미 보여주던 답은 그대로 두고 다음 주기에 다시 시도
      setRefreshFailed(true)
      setLoadState((prev) => (prev === 'loading' ? 'error' : prev))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  usePolling(load, ANSWERS_POLL_INTERVAL_MS, loadState === 'ready')

  return { teams, loadState, loadedAt, refreshFailed, reload: load }
}
