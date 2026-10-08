import { COURSE_STOP_IDS } from './course'
import type { StopId } from './course'

// 투표 화면에 보이는 미션 사진(미션 1건당 1장). 득표 수는 운영자 결과에만 온다
export interface ZooPhoto {
  // 미션 id. 투표할 때 쓴다
  id: number
  stopId: StopId
  teamId: number
  teamName: string
  photoPath: string
  submittedAt: string
  updatedAt: string
  // 우리 조 사진에는 투표할 수 없다
  isMyTeam: boolean
  isVoted: boolean
}

export interface ZooPhotoListResponse {
  photos: ZooPhoto[]
}

export interface ZooPhotoResult {
  id: number
  stopId: StopId
  teamId: number
  teamName: string
  photoPath: string
  voteCount: number
}

export interface ZooPhotoResultsResponse {
  // 한 장이라도 투표한 사람 수
  voterCount: number
  photos: ZooPhotoResult[]
}

export interface StopGroup<T> {
  stopId: StopId
  items: T[]
}

// 사진 투표를 여는 시각(한국 시간). 모든 조가 코스를 마치고 정문에 모이는 오후 4:30에 맞췄다.
// 바꿀 때는 아래 안내 문구도 같이 고친다
export const PHOTO_VOTE_OPENS_AT = new Date('2026-10-10T16:30:00+09:00')
export const PHOTO_VOTE_OPENS_LABEL = '10월 10일(토) 오후 4:30'

export const isPhotoVoteOpen = (now: number = Date.now()): boolean => now >= PHOTO_VOTE_OPENS_AT.getTime()

// 32비트 해시(FNV-1a에 murmur3 마무리 섞기). 비슷한 입력도 고르게 흩어진다
const hash = (text: string): number => {
  let value = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    value ^= text.charCodeAt(i)
    value = Math.imul(value, 0x01000193)
  }
  value ^= value >>> 16
  value = Math.imul(value, 0x85ebca6b)
  value ^= value >>> 13
  value = Math.imul(value, 0xc2b2ae35)
  value ^= value >>> 16
  return value >>> 0
}

// 앞에 나오는 사진이 표를 더 받지 않도록 사람마다 순서를 다르게 섞는다.
// 같은 사람에게는 늘 같은 순서라서, 새로고침하거나 새 사진이 올라와도 보던 사진들의 순서가 뒤섞이지 않는다.
export const orderForViewer = <T extends { id: number }>(items: T[], viewerId: number): T[] =>
  [...items].sort((a, b) => hash(`${viewerId}:${a.id}`) - hash(`${viewerId}:${b.id}`) || a.id - b.id)

// A코스 순서로 장소별로 묶는다. 사진이 없는 장소는 빠진다
export const groupByStop = <T extends { stopId: StopId }>(items: T[]): StopGroup<T>[] =>
  COURSE_STOP_IDS.A.map((stopId) => ({ stopId, items: items.filter((item) => item.stopId === stopId) })).filter(
    (group) => group.items.length > 0
  )

export interface RankedPhotoResult extends ZooPhotoResult {
  // 같은 표 수는 같은 순위 (1, 1, 3, …)
  rank: number
}

export const rankResults = (results: ZooPhotoResult[]): RankedPhotoResult[] => {
  const sorted = [...results].sort((a, b) => b.voteCount - a.voteCount || a.id - b.id)
  return sorted.map((result) => ({
    ...result,
    rank: sorted.findIndex((other) => other.voteCount === result.voteCount) + 1,
  }))
}
