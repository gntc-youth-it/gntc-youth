import type { Slot } from './types'

export interface SlotInfo {
  id: Slot
  label: string
  // 기록을 올릴 수 있는 KST 시(hour). 자정부터 아침 6시까지는 열린 칸이 없다
  startHour: number
  endHour: number
}

export const SLOTS: readonly SlotInfo[] = [
  { id: 'MORNING', label: '아침', startHour: 6, endHour: 12 },
  { id: 'AFTERNOON', label: '오후', startHour: 12, endHour: 18 },
  { id: 'EVENING', label: '저녁', startHour: 18, endHour: 24 },
]

const HOUR_MS = 60 * 60 * 1000
// 한국은 서머타임이 없어서 +9시간 고정으로 계산해도 된다
const KST_OFFSET_MS = 9 * HOUR_MS
// 첫 칸(아침)이 열리는 6시에 '오늘'이 바뀐다. 자정~6시에 들어오면 전날 기록을 보여 준다
const DAY_START_HOUR = 6
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// 서버는 시간대 없이 UTC 시각을 보낸다('2026-11-09T04:05:12.123'). 오프셋이 없으면 UTC로 읽는다
export const parseServerTime = (value: string): number =>
  Date.parse(/(Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}Z`)

export const getSlotInfo = (slot: Slot): SlotInfo => SLOTS.find((info) => info.id === slot) ?? SLOTS[0]

export const getSlotOrder = (slot: Slot): number => SLOTS.findIndex((info) => info.id === slot)

// 화면에서 '오늘'로 보여 줄 날짜 'YYYY-MM-DD'. 아침 6시(KST)에 바뀐다
export const getMissionDate = (at: Date): string =>
  new Date(at.getTime() + KST_OFFSET_MS - DAY_START_HOUR * HOUR_MS).toISOString().slice(0, 10)

// 지금 기록을 올릴 수 있는 칸. 자정~아침 6시에는 없다
export const getCurrentSlot = (at: Date): Slot | null => {
  const hour = new Date(at.getTime() + KST_OFFSET_MS).getUTCHours()
  return SLOTS.find((slot) => hour >= slot.startHour && hour < slot.endHour)?.id ?? null
}

// 그 날짜의 칸이 열리는 순간과 닫히는 순간
export const getSlotRange = (missionDate: string, slot: Slot): { start: Date; end: Date } => {
  const { startHour, endHour } = getSlotInfo(slot)
  const midnight = Date.parse(`${missionDate}T00:00:00+09:00`)
  return { start: new Date(midnight + startHour * HOUR_MS), end: new Date(midnight + endHour * HOUR_MS) }
}

// 'YYYY-MM-DD' 모양이면서 실제로 있는 날짜인지. 2026-02-30 같은 날짜도 거른다
export const isValidMissionDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export const shiftMissionDate = (missionDate: string, days: number): string => {
  const date = new Date(`${missionDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

// '11월 9일 (월)'
export const formatMissionDate = (missionDate: string): string => {
  const date = new Date(`${missionDate}T00:00:00Z`)
  return `${date.getUTCMonth() + 1}월 ${date.getUTCDate()}일 (${WEEKDAYS[date.getUTCDay()]})`
}

// KST 'HH:mm'
export const formatKstTime = (at: string | Date): string => {
  const time = typeof at === 'string' ? parseServerTime(at) : at.getTime()
  const kst = new Date(time + KST_OFFSET_MS)
  return `${String(kst.getUTCHours()).padStart(2, '0')}:${String(kst.getUTCMinutes()).padStart(2, '0')}`
}

// 칸이 닫히기 직전 시각. 오후면 '17:59'
export const formatSlotDeadline = (missionDate: string, slot: Slot): string =>
  formatKstTime(new Date(getSlotRange(missionDate, slot).end.getTime() - 60 * 1000))

// '방금 전' / '12분 전' / '3시간 전'. 하루가 넘으면 시각만 보여 준다
export const formatRelativeTime = (at: string, now: Date): string => {
  const minutes = Math.floor((now.getTime() - parseServerTime(at)) / (60 * 1000))
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)}시간 전`
  return formatKstTime(at)
}
