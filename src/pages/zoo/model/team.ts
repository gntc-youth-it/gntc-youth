import type { CourseId, StopId } from './course'

// 모집 중 → (조장이 마감) → 출발
export type ZooTeamStatus = 'RECRUITING' | 'STARTED'

export interface ZooTeamMember {
  userId: number
  name: string
  profileImagePath: string | null
  isLeader: boolean
  joinedAt: string
}

export interface ZooTeamArrival {
  stopId: StopId
  arrivedAt: string
}

export interface ZooTeamSummary {
  id: number
  name: string
  course: CourseId
  status: ZooTeamStatus
  leaderName: string
  memberCount: number
  arrivedCount: number
  createdAt: string
}

export interface ZooTeamDetail {
  id: number
  name: string
  course: CourseId
  status: ZooTeamStatus
  leaderUserId: number
  members: ZooTeamMember[]
  arrivals: ZooTeamArrival[]
  createdAt: string
  startedAt: string | null
}

export interface ZooTeamListResponse {
  teams: ZooTeamSummary[]
}

export interface MyZooTeamResponse {
  team: ZooTeamDetail | null
}

export interface CreateZooTeamRequest {
  name: string
  course: CourseId
}

export const TEAM_NAME_MAX_LENGTH = 20

// 백엔드 ExceptionCode 중 화면에서 따로 처리하는 것
export const ZOO_ERROR_CODE = {
  ALREADY_IN_TEAM: 5002,
} as const
