import { useCallback, useEffect, useState } from 'react'
import { fetchMyZooTeam, fetchZooTeams } from '../api/zooTeamApi'
import type { ZooTeamDetail, ZooTeamSummary } from './team'
import { usePolling } from './usePolling'

export const LOBBY_POLL_INTERVAL_MS = 5000

export type ZooLobbyLoadState = 'loading' | 'ready' | 'error'

// 모집 중인 조를 먼저, 같은 상태끼리는 최근에 만든 조부터
export const sortTeams = (teams: ZooTeamSummary[]): ZooTeamSummary[] =>
  [...teams].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'RECRUITING' ? -1 : 1
    return b.createdAt.localeCompare(a.createdAt)
  })

export const useZooLobby = (enabled: boolean) => {
  const [teams, setTeams] = useState<ZooTeamSummary[]>([])
  const [myTeam, setMyTeam] = useState<ZooTeamDetail | null>(null)
  const [loadState, setLoadState] = useState<ZooLobbyLoadState>('loading')

  const load = useCallback(async () => {
    try {
      const [mine, list] = await Promise.all([fetchMyZooTeam(), fetchZooTeams()])
      setMyTeam(mine.team)
      setTeams(sortTeams(list.teams))
      setLoadState('ready')
    } catch {
      setLoadState((prev) => (prev === 'loading' ? 'error' : prev))
    }
  }, [])

  // 내 조는 내가 들어가거나 나갈 때만 바뀌므로 주기적으로는 목록만 새로 받는다
  const refreshTeams = useCallback(async () => {
    const list = await fetchZooTeams()
    setTeams(sortTeams(list.teams))
  }, [])

  useEffect(() => {
    if (enabled) void load()
  }, [enabled, load])

  usePolling(refreshTeams, LOBBY_POLL_INTERVAL_MS, enabled && loadState === 'ready')

  return { teams, myTeam, loadState, reload: load }
}
