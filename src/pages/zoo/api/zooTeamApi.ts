import { apiRequest } from '../../../shared/api'
import type { CourseId, StopId } from '../model/course'
import type {
  CreateZooTeamRequest,
  MyZooTeamResponse,
  SubmitZooMissionRequest,
  ZooMissionResultsResponse,
  ZooTeamDetail,
  ZooTeamListResponse,
} from '../model/team'

export const fetchZooTeams = async (): Promise<ZooTeamListResponse> => {
  return apiRequest<ZooTeamListResponse>('/zoo/teams')
}

export const fetchMyZooTeam = async (): Promise<MyZooTeamResponse> => {
  return apiRequest<MyZooTeamResponse>('/zoo/teams/me')
}

export const fetchZooTeam = async (teamId: number): Promise<ZooTeamDetail> => {
  return apiRequest<ZooTeamDetail>(`/zoo/teams/${teamId}`)
}

export const createZooTeam = async (data: CreateZooTeamRequest): Promise<ZooTeamDetail> => {
  return apiRequest<ZooTeamDetail>('/zoo/teams', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const joinZooTeam = async (teamId: number): Promise<ZooTeamDetail> => {
  return apiRequest<ZooTeamDetail>(`/zoo/teams/${teamId}/join`, { method: 'POST' })
}

export const leaveZooTeam = async (teamId: number): Promise<void> => {
  await apiRequest<void>(`/zoo/teams/${teamId}/leave`, { method: 'POST' })
}

export const deleteZooTeam = async (teamId: number): Promise<void> => {
  await apiRequest<void>(`/zoo/teams/${teamId}`, { method: 'DELETE' })
}

export const changeZooTeamCourse = async (teamId: number, course: CourseId): Promise<ZooTeamDetail> => {
  return apiRequest<ZooTeamDetail>(`/zoo/teams/${teamId}`, {
    method: 'PATCH',
    body: JSON.stringify({ course }),
  })
}

export const startZooTeam = async (teamId: number): Promise<ZooTeamDetail> => {
  return apiRequest<ZooTeamDetail>(`/zoo/teams/${teamId}/start`, { method: 'POST' })
}

// 답과 사진을 내면 그 장소가 도착 처리된다. 이미 낸 장소에 다시 보내면 수정
export const submitZooMission = async (
  teamId: number,
  stopId: StopId,
  data: SubmitZooMissionRequest
): Promise<ZooTeamDetail> => {
  return apiRequest<ZooTeamDetail>(`/zoo/teams/${teamId}/missions/${stopId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export const transferZooTeamLeader = async (teamId: number, userId: number): Promise<ZooTeamDetail> => {
  return apiRequest<ZooTeamDetail>(`/zoo/teams/${teamId}/leader`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  })
}

// 모든 조의 제출 내용. 운영자(MASTER)만 볼 수 있다
export const fetchZooMissionResults = async (): Promise<ZooMissionResultsResponse> => {
  return apiRequest<ZooMissionResultsResponse>('/zoo/missions')
}
