import {
  formatKstTime,
  formatMissionDate,
  formatRelativeTime,
  formatSlotDeadline,
  getCurrentSlot,
  getMissionDate,
  getSlotRange,
  isValidMissionDate,
  parseServerTime,
  shiftMissionDate,
} from '../slots'

const kst = (value: string) => new Date(`${value}+09:00`)

describe('getMissionDate', () => {
  it('아침 6시가 되어야 오늘이 바뀐다', () => {
    expect(getMissionDate(kst('2026-11-10T05:59:00'))).toBe('2026-11-09')
    expect(getMissionDate(kst('2026-11-10T06:00:00'))).toBe('2026-11-10')
  })

  it('자정이 지나도 아침 6시 전이면 전날 기록을 보여 준다', () => {
    expect(getMissionDate(kst('2026-11-10T00:30:00'))).toBe('2026-11-09')
  })

  it('저녁에 올린 기록은 그날 날짜다', () => {
    expect(getMissionDate(kst('2026-11-09T23:59:00'))).toBe('2026-11-09')
  })
})

describe('getCurrentSlot', () => {
  it.each([
    ['2026-11-09T06:00:00', 'MORNING'],
    ['2026-11-09T11:59:00', 'MORNING'],
    ['2026-11-09T12:00:00', 'AFTERNOON'],
    ['2026-11-09T17:59:00', 'AFTERNOON'],
    ['2026-11-09T18:00:00', 'EVENING'],
    ['2026-11-09T23:59:00', 'EVENING'],
  ])('%s(KST)는 %s 칸이다', (time, slot) => {
    expect(getCurrentSlot(kst(time))).toBe(slot)
  })

  it.each(['2026-11-10T00:00:00', '2026-11-10T03:00:00', '2026-11-10T05:59:00'])(
    '%s(KST)에는 열린 칸이 없다',
    (time) => {
      expect(getCurrentSlot(kst(time))).toBeNull()
    }
  )
})

describe('getSlotRange', () => {
  it('저녁 칸은 자정에 닫힌다', () => {
    const { start, end } = getSlotRange('2026-11-09', 'EVENING')
    expect(start.toISOString()).toBe(kst('2026-11-09T18:00:00').toISOString())
    expect(end.toISOString()).toBe(kst('2026-11-10T00:00:00').toISOString())
  })

  it('아침 칸은 6시에 열린다', () => {
    expect(getSlotRange('2026-11-09', 'MORNING').start.toISOString()).toBe(kst('2026-11-09T06:00:00').toISOString())
  })
})

describe('formatSlotDeadline', () => {
  it('칸이 닫히기 1분 전 시각을 보여 준다', () => {
    expect(formatSlotDeadline('2026-11-09', 'MORNING')).toBe('11:59')
    expect(formatSlotDeadline('2026-11-09', 'AFTERNOON')).toBe('17:59')
    expect(formatSlotDeadline('2026-11-09', 'EVENING')).toBe('23:59')
  })
})

describe('isValidMissionDate', () => {
  it.each(['2026-11-09', '2026-02-28', '2028-02-29'])('%s는 쓸 수 있는 날짜다', (value) => {
    expect(isValidMissionDate(value)).toBe(true)
  })

  it.each(['', 'foo', '2026-11-9', '2026-02-30', '2026-13-01', '2026-11-09T00:00'])('"%s"는 날짜가 아니다', (value) => {
    expect(isValidMissionDate(value)).toBe(false)
  })
})

describe('parseServerTime', () => {
  it('서버가 시간대 없이 보낸 시각은 UTC로 읽는다', () => {
    expect(parseServerTime('2026-11-09T04:05:12.123')).toBe(Date.parse('2026-11-09T04:05:12.123Z'))
    expect(formatKstTime('2026-11-09T04:05:12.123')).toBe('13:05')
  })

  it('시간대가 붙어 있으면 그대로 읽는다', () => {
    expect(parseServerTime('2026-11-09T13:05:00+09:00')).toBe(Date.parse('2026-11-09T04:05:00Z'))
    expect(parseServerTime('2026-11-09T04:05:00Z')).toBe(Date.parse('2026-11-09T04:05:00Z'))
  })
})

describe('날짜·시각 표시', () => {
  it('날짜를 요일과 함께 보여 준다', () => {
    expect(formatMissionDate('2026-11-09')).toBe('11월 9일 (월)')
  })

  it('달이 바뀌어도 날짜를 넘긴다', () => {
    expect(shiftMissionDate('2026-11-30', 1)).toBe('2026-12-01')
    expect(shiftMissionDate('2026-11-01', -1)).toBe('2026-10-31')
  })

  it('시각은 KST로 보여 준다', () => {
    expect(formatKstTime('2026-11-09T07:05:00+09:00')).toBe('07:05')
    expect(formatKstTime('2026-11-08T23:30:00Z')).toBe('08:30')
  })

  it('얼마 전에 올렸는지 보여 준다', () => {
    const now = kst('2026-11-09T13:20:00')
    expect(formatRelativeTime('2026-11-09T13:19:40+09:00', now)).toBe('방금 전')
    expect(formatRelativeTime('2026-11-09T13:05:00+09:00', now)).toBe('15분 전')
    expect(formatRelativeTime('2026-11-09T07:55:00+09:00', now)).toBe('5시간 전')
    expect(formatRelativeTime('2026-11-08T08:40:00+09:00', now)).toBe('08:40')
  })
})
