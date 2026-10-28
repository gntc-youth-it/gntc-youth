// 범사에 감사로그 화면과 API가 주고받는 모양. BE 요청서의 계약과 같게 유지한다

export type Slot = 'MORNING' | 'AFTERNOON' | 'EVENING'

export type ReactionEmoji = 'PRAY' | 'HEART' | 'CLAP' | 'TOUCHED' | 'LAUGH'

export interface ThanksAuthor {
  userId: number
  name: string
  profileImageUrl: string | null
}

export interface ThanksMedia {
  fileId: number
  // 'uploads/...' 경로(갤러리 API처럼). 화면에서 CDN 주소로 바꾼다
  url: string
  type: 'IMAGE' | 'VIDEO'
}

export interface ThanksReaction {
  emoji: ReactionEmoji
  count: number
  reactedByMe: boolean
}

export interface ThanksComment {
  id: number
  author: ThanksAuthor
  content: string
  isMine: boolean
  createdAt: string
}

export interface ThanksEntry {
  id: number
  // 올린 날의 KST 날짜 'YYYY-MM-DD'. 06~24시에만 올릴 수 있어서 달력 날짜와 같다
  missionDate: string
  slot: Slot
  content: string
  media: ThanksMedia
  author: ThanksAuthor
  reactions: ThanksReaction[]
  commentCount: number
  latestComment: { author: ThanksAuthor; content: string } | null
  isMine: boolean
  createdAt: string
}

// 한 사람의 하루 기록. 메인 목록은 마지막으로 올린 시각이 최신인 사람부터 보여 준다
export interface ThanksLog {
  author: ThanksAuthor
  entries: ThanksEntry[]
  lastPostedAt: string
}

// GET /thanks/entries?date= — 그날 기록 전부. 사람별로 묶는 건 화면에서 한다
export interface ThanksEntriesResponse {
  date: string
  entries: ThanksEntry[]
}

// PUT·DELETE /thanks/entries/{id}/reactions/{emoji}
export interface ThanksEntryReactionsResponse {
  entryId: number
  reactions: ThanksReaction[]
}

export interface CreateThanksEntryRequest {
  content: string
  fileId: number
}

// 백엔드 ExceptionCode 중 화면에서 따로 안내하는 것
export const THANKS_ERROR_CODE = {
  SLOT_CLOSED: 6001,
  ALREADY_POSTED: 6002,
  ENTRY_NOT_FOUND: 6003,
  // 남이 올린 파일, 사진·영상이 아닌 파일, 이미 다른 감사에 붙은 파일
  FILE_NOT_ATTACHABLE: 6005,
  // 공통 코드. 감사를 지우면 붙어 있던 파일도 지워져서, 그 fileId를 다시 보내면 이 오류가 난다
  FILE_NOT_FOUND: 3001,
} as const

export const CONTENT_MAX_LENGTH = 80
// 영상은 이 초만큼만 찍고, 앨범 영상은 앞에서부터 이만큼만 남긴다
export const VIDEO_MAX_SECONDS = 5
export const COMMENT_MAX_LENGTH = 100
