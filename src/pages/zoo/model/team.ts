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

export interface ZooMissionAnswer {
  questionId: string
  answer: string
}

// 장소별 미션 제출 내용. 제출하면 그 장소가 도착 처리된다
export interface ZooTeamMission {
  stopId: StopId
  answers: ZooMissionAnswer[]
  photoFileId: number
  photoPath: string
  submittedAt: string
  updatedAt: string
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
  // 조원과 운영자에게만 채워져 온다. 미션 API 배포 전 서버는 이 필드를 보내지 않는다
  missions?: ZooTeamMission[]
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

export interface SubmitZooMissionRequest {
  answers: ZooMissionAnswer[]
  photoFileId: number
}

export const TEAM_NAME_MAX_LENGTH = 20

// 백엔드 ExceptionCode 중 화면에서 따로 처리하는 것
export const ZOO_ERROR_CODE = {
  ALREADY_IN_TEAM: 5002,
  PHOTO_NOT_FOUND: 5009,
  OWN_TEAM_PHOTO: 5010,
} as const
