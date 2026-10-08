import { useCallback, useEffect, useState } from 'react'
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

  const load = useCallback(async () => {
    try {
      const response = await fetchZooMissionResults()
      setTeams(response.teams)
      setLoadedAt(new Date())
      setLoadState('ready')
    } catch (error) {
      // 운영자 권한이 없어진 경우. 화면에서는 운영자에게만 열지만 서버가 최종으로 막는다
      if (error instanceof HttpError && error.status === 403) {
        setLoadState('forbidden')
        return
      }
      // 이미 보여주던 답은 그대로 두고 다음 주기에 다시 시도
      setLoadState((prev) => (prev === 'loading' ? 'error' : prev))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  usePolling(load, ANSWERS_POLL_INTERVAL_MS, loadState === 'ready')

  return { teams, loadState, loadedAt, reload: load }
}
