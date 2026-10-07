import { useCallback, useEffect, useRef, useState } from 'react'
import { HttpError } from '../../../shared/api'
import {
  changeZooTeamCourse,
  deleteZooTeam,
  fetchZooTeam,
  joinZooTeam,
  leaveZooTeam,
  startZooTeam,
  submitZooMission,
  transferZooTeamLeader,
} from '../api/zooTeamApi'
import type { CourseId, StopId } from './course'
import type { SubmitZooMissionRequest, ZooTeamDetail } from './team'
import { usePolling } from './usePolling'

export const TEAM_POLL_INTERVAL_MS = 5000

export type ZooTeamLoadState = 'loading' | 'ready' | 'notFound' | 'error'

export type ZooTeamAction = 'join' | 'leave' | 'delete' | 'course' | 'start' | 'mission' | 'leader'

export interface ZooActionError {
  message: string
  code?: string | number
}

export const toActionError = (error: unknown): ZooActionError => {
  if (error instanceof HttpError) return { message: error.message, code: error.code }
  return { message: '네트워크가 불안정해요. 잠시 후 다시 시도해 주세요.' }
}

export const useZooTeam = (teamId: number) => {
  const [team, setTeam] = useState<ZooTeamDetail | null>(null)
  const [loadState, setLoadState] = useState<ZooTeamLoadState>('loading')
  const [pendingAction, setPendingAction] = useState<ZooTeamAction | null>(null)
  const [actionError, setActionError] = useState<ZooActionError | null>(null)

  // 늦게 도착한 이전 응답이 더 최신 상태를 덮어쓰지 않도록 요청마다 순번을 매긴다
  const requestSeq = useRef(0)
  const appliedSeq = useRef(0)

  const applyTeam = useCallback((seq: number, data: ZooTeamDetail) => {
    if (seq < appliedSeq.current) return
    appliedSeq.current = seq
    setTeam(data)
    setLoadState('ready')
  }, [])

  const load = useCallback(async () => {
    const seq = ++requestSeq.current
    try {
      applyTeam(seq, await fetchZooTeam(teamId))
    } catch (error) {
      if (seq < appliedSeq.current) return
      if (error instanceof HttpError && error.status === 404) {
        appliedSeq.current = seq
        setTeam(null)
        setLoadState('notFound')
        return
      }
      // 이미 보여주던 정보는 그대로 두고 다음 주기에 다시 시도
      setLoadState((prev) => (prev === 'loading' ? 'error' : prev))
    }
  }, [teamId, applyTeam])

  useEffect(() => {
    setTeam(null)
    setLoadState('loading')
    void load()
  }, [load])

  usePolling(load, TEAM_POLL_INTERVAL_MS, loadState === 'ready' || loadState === 'error')

  const runAction = useCallback(
    async (action: ZooTeamAction, request: () => Promise<ZooTeamDetail | void>): Promise<boolean> => {
      const seq = ++requestSeq.current
      setPendingAction(action)
      setActionError(null)
      try {
        const data = await request()
        if (data) applyTeam(seq, data)
        // 나가기·삭제처럼 응답 본문이 없어도, 그 전에 출발한 조회 결과는 더 이상 반영하지 않는다
        else appliedSeq.current = Math.max(appliedSeq.current, seq)
        return true
      } catch (error) {
        setActionError(toActionError(error))
        // 실패한 이유가 다른 사람의 변경일 수 있어 서버 상태와 다시 맞춘다
        void load()
        return false
      } finally {
        setPendingAction(null)
      }
    },
    [applyTeam, load]
  )

  return {
    team,
    loadState,
    reload: load,
    pendingAction,
    actionError,
    clearActionError: useCallback(() => setActionError(null), []),
    join: () => runAction('join', () => joinZooTeam(teamId)),
    leave: () => runAction('leave', () => leaveZooTeam(teamId)),
    remove: () => runAction('delete', () => deleteZooTeam(teamId)),
    changeCourse: (course: CourseId) => runAction('course', () => changeZooTeamCourse(teamId, course)),
    start: () => runAction('start', () => startZooTeam(teamId)),
    submitMission: (stopId: StopId, data: SubmitZooMissionRequest) =>
      runAction('mission', () => submitZooMission(teamId, stopId, data)),
    transferLeader: (userId: number) => runAction('leader', () => transferZooTeamLeader(teamId, userId)),
  }
}
