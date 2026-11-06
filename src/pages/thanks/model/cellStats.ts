import { formatRelativeTime, parseServerTime, shiftMissionDate } from './slots'
import type { ThanksCellMemberStats } from './types'

// 히트맵에 보여 주는 날 수. 폰 폭에서 칸이 너무 작아지지 않는 만큼만 둔다
export const HEATMAP_DAYS = 14

// 오늘이 맨 뒤에 오는 최근 날짜들
export const getHeatmapDates = (today: string): string[] =>
  Array.from({ length: HEATMAP_DAYS }, (_, index) => shiftMissionDate(today, index - HEATMAP_DAYS + 1))

export const countEntries = ({ dailyCounts }: ThanksCellMemberStats): number =>
  dailyCounts.reduce((sum, day) => sum + day.count, 0)

// 최근에 올린 사람부터. 아직 안 올린 사람은 맨 뒤에 이름 순으로 둔다
export const sortMembers = (members: ThanksCellMemberStats[]): ThanksCellMemberStats[] =>
  [...members].sort((a, b) => {
    if (a.lastPostedAt && b.lastPostedAt) return parseServerTime(b.lastPostedAt) - parseServerTime(a.lastPostedAt)
    if (a.lastPostedAt) return -1
    if (b.lastPostedAt) return 1
    return a.user.name.localeCompare(b.user.name, 'ko')
  })

// 지난 날짜까지 보여 주는 화면이라, 하루가 지나면 시각 대신 며칠 전인지 보여 준다
export const formatLastPosted = (at: string, now: Date): string => {
  const days = Math.floor((now.getTime() - parseServerTime(at)) / (24 * 60 * 60 * 1000))
  return days < 1 ? formatRelativeTime(at, now) : `${days}일 전`
}
