import { countEntries, formatLastPosted, getHeatmapDates, HEATMAP_DAYS, sortMembers } from '../cellStats'
import type { ThanksCellMemberStats } from '../types'

const member = (
  name: string,
  lastPostedAt: string | null,
  dailyCounts: ThanksCellMemberStats['dailyCounts'] = []
): ThanksCellMemberStats => ({
  user: { userId: 1, name, profileImageUrl: null },
  lastPostedAt,
  dailyCounts,
})

describe('getHeatmapDates', () => {
  it('오늘이 맨 뒤에 오는 최근 날짜를 달이 바뀌어도 이어서 돌려준다', () => {
    const dates = getHeatmapDates('2026-11-09')

    expect(dates).toHaveLength(HEATMAP_DAYS)
    expect(dates[0]).toBe('2026-10-27')
    expect(dates[dates.length - 1]).toBe('2026-11-09')
  })
})

describe('countEntries', () => {
  it('날짜와 상관없이 올린 감사를 전부 센다', () => {
    const counted = member('김하늘', '2026-11-09T04:00:00', [
      { date: '2026-01-01', count: 3 },
      { date: '2026-11-09', count: 2 },
    ])

    expect(countEntries(counted)).toBe(5)
  })

  it('안 올린 사람은 0개다', () => {
    expect(countEntries(member('이서준', null))).toBe(0)
  })
})

describe('sortMembers', () => {
  it('최근에 올린 사람부터, 안 올린 사람은 맨 뒤에 이름 순으로 둔다', () => {
    const members = [
      member('한지우', null),
      member('정은혜', '2026-11-08T03:00:00'),
      member('임하은', null),
      member('김하늘', '2026-11-09T04:00:00'),
    ]

    expect(sortMembers(members).map(({ user }) => user.name)).toEqual(['김하늘', '정은혜', '임하은', '한지우'])
  })

  it('받은 목록의 순서는 건드리지 않는다', () => {
    const members = [member('임하은', null), member('김하늘', '2026-11-09T04:00:00')]

    sortMembers(members)

    expect(members[0].user.name).toBe('임하은')
  })
})

describe('formatLastPosted', () => {
  const now = new Date('2026-11-09T04:20:00Z')

  it('하루가 안 지났으면 몇 분·몇 시간 전인지 보여 준다', () => {
    expect(formatLastPosted('2026-11-09T04:10:00', now)).toBe('10분 전')
    expect(formatLastPosted('2026-11-08T05:00:00', now)).toBe('23시간 전')
  })

  it('하루가 지나면 며칠 전인지 보여 준다', () => {
    expect(formatLastPosted('2026-11-08T04:20:00', now)).toBe('1일 전')
    expect(formatLastPosted('2026-10-27T04:20:00', now)).toBe('13일 전')
  })
})
